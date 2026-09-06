/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// Collecting winnings, which nothing else does for you.
//
// A settled market pays out only when you ask it to. Nobody sweeps for you, and
// the position does not decay into collateral on its own: it just sits there.
// A bot that trades for a week and never redeems has its balance spread across
// dozens of finalised markets while its wallet reads near zero.
//
// So every strategy claims as it goes. `maybeClaim` is the whole interface —
// call it once per loop and it decides whether enough time has passed.
//
// It is a LOOP call rather than a timer on purpose. Claiming signs transactions
// from the same key the strategy trades with, and two senders on one key race
// each other's nonce ("nonce too low", one of them lost). Driving it from the
// strategy's own loop serialises it with that strategy's writes for free.

import type { MarketOnchain, UnifiedMarket } from "@somnia-chain/markets-sdk";
import type { EcContext } from "./exchange.js";
import { settledMarkets } from "./markets.js";
import { claimableOutcomes, estimatePayout, redeemOutcome, settlementFeeBps } from "./settlement.js";

const log = (s: string) => console.log(`${new Date().toISOString()} ${s}`);

/** Per-process throttle. Keyed by nothing: one strategy, one wallet, one loop. */
let lastSweepAt = 0;

export interface ClaimOptions {
  /** How often to sweep. Default `AUTO_CLAIM_INTERVAL_MS`, else 10 minutes. */
  intervalMs?: number;
  /** How many recently settled markets to look at. Default `CLAIM_SCAN`, else 25. */
  scan?: number;
  /** Log even when there was nothing to do. Default false, to keep loops quiet. */
  verbose?: boolean;
}

const envNum = (k: string, fallback: number): number => {
  const v = Number(process.env[k]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

/** Auto-claim is on unless `AUTO_CLAIM` is explicitly false/0. */
export const autoClaimEnabled = (): boolean =>
  process.env.AUTO_CLAIM !== "false" && process.env.AUTO_CLAIM !== "0";

/**
 * Sweep settled markets and redeem anything claimable. Returns the number of
 * markets claimed from.
 *
 * Safe to call with no signer or in dry-run: it reports and redeems nothing.
 */
export async function claimSettled(ctx: EcContext, opts: ClaimOptions = {}): Promise<number> {
  const addr = ctx.exchange.walletAddress;
  if (!addr) {
    if (opts.verbose) log("claim: no PRIVATE_KEY, nothing to claim for.");
    return 0;
  }
  const scan = opts.scan ?? envNum("CLAIM_SCAN", 25);
  const settled = await settledMarkets(ctx, scan);
  if (opts.verbose) log(`claim: scanning ${settled.length} recently settled market(s) …`);

  let claimed = 0;
  for (const row of settled) {
    const onchain = await ctx.exchange.client.getMarketOnchain(row.marketId).catch(() => null);
    if (!onchain || !(onchain.isResolved || onchain.isVoided)) continue;
    const held = {
      yes: await ctx.exchange.client.getOutcomeBalance({ outcomeToken: onchain.outcomeToken, account: addr, id: onchain.yesId }),
      no: await ctx.exchange.client.getOutcomeBalance({ outcomeToken: onchain.outcomeToken, account: addr, id: onchain.noId }),
    };
    if (claimableOutcomes(onchain, held).length === 0) continue;
    // settledMarkets returns rows, not unified markets; the redeem path only
    // needs the id and a label.
    const market = {
      symbol: row.symbol,
      info: { marketType: "BINARY", marketId: row.marketId },
    } as unknown as UnifiedMarket;
    if (await redeemHoldings(ctx, market, onchain, held)) claimed++;
  }
  if (opts.verbose || claimed > 0) {
    log(claimed === 0 ? "claim: nothing to claim." : `claim: claimed across ${claimed} market(s).`);
  }
  return claimed;
}

/**
 * Redeem every claimable side of one settled market. Returns true if anything
 * was redeemed (or would have been, in dry-run).
 */
export async function redeemHoldings(
  ctx: EcContext,
  market: UnifiedMarket,
  onchain: MarketOnchain,
  known?: { yes: bigint; no: bigint },
): Promise<boolean> {
  const addr = ctx.exchange.walletAddress;
  if (!ctx.canTrade || !addr) return false;

  const held =
    known ?? {
      yes: await ctx.exchange.client.getOutcomeBalance({ outcomeToken: onchain.outcomeToken, account: addr, id: onchain.yesId }),
      no: await ctx.exchange.client.getOutcomeBalance({ outcomeToken: onchain.outcomeToken, account: addr, id: onchain.noId }),
    };
  const claims = claimableOutcomes(onchain, held);
  if (claims.length === 0) return false;
  // Dry-run reports what it would do and claims nothing, so the caller's
  // "claimed across N market(s)" must not count it.
  if (ctx.config.dryRun) {
    const feeDry = await settlementFeeBps(ctx, market, onchain);
    for (const outcome of claims) {
      const amount = outcome === 0 ? held.yes : held.no;
      const payout = estimatePayout({ onchain, outcome, amount, feeBps: feeDry });
      log(
        `DRY redeem ${(Number(amount) / 10 ** onchain.decimals).toFixed(4)} ` +
          `${outcome === 0 ? "YES" : "NO"} ${market.symbol} → ~${(Number(payout) / 10 ** onchain.decimals).toFixed(4)} collateral`,
      );
    }
    return false;
  }

  // The winner pays 1 − settlement fee, so read the venue's fee rather than
  // assuming 1:1. A voided market pays both sides 0.5 and skims no fee.
  const feeBps = await settlementFeeBps(ctx, market, onchain);
  const dp = onchain.decimals;
  const h = (v: bigint) => (Number(v) / 10 ** dp).toFixed(4);

  for (const outcome of claims) {
    const amount = outcome === 0 ? held.yes : held.no;
    const label = outcome === 0 ? "YES" : "NO";
    const payout = estimatePayout({ onchain, outcome, amount, feeBps });
    await redeemOutcome(ctx, market, onchain, outcome, amount);
    log(`redeemed ${h(amount)} ${label} ${market.symbol} → ~${h(payout)} collateral`);
  }
  return true;
}

/**
 * Call once per strategy loop. Sweeps at most every `intervalMs`, and does
 * nothing at all when `AUTO_CLAIM=false`.
 *
 * Failures are swallowed: an indexer hiccup should never take a trading bot
 * down, and the next tick tries again.
 */
export async function maybeClaim(ctx: EcContext, opts: ClaimOptions = {}): Promise<void> {
  if (!autoClaimEnabled() || !ctx.exchange.walletAddress) return;
  const interval = opts.intervalMs ?? envNum("AUTO_CLAIM_INTERVAL_MS", 10 * 60_000);
  const now = Date.now();
  if (now - lastSweepAt < interval) return;
  lastSweepAt = now;
  try {
    await claimSettled(ctx, opts);
  } catch (e) {
    log(`claim: sweep failed, will retry — ${(e as Error).message}`);
  }
}
