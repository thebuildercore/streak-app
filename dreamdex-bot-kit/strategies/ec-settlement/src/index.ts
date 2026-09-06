/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// settlement-watcher — follows one market through its lifecycle and redeems when
// it settles. This is the other half of trading a binary market: an outcome
// token only turns back into collateral at resolution.
//
//   • The winner redeems for `1 − settlement fee`, NOT 1:1. The loser is worth 0.
//   • A VOIDED market refunds BOTH sides at 0.5, with no fee.
//
// Watches the first active market (or EC_MARKET symbol if set), logs each status
// transition, and — once resolved/voided — reports the payout and redeems any
// tokens the signer holds. Read-only without a PRIVATE_KEY (it just reports).
//
//   npm start -w ec-settlement
//
// Already holding positions in markets that settled while you weren't watching?
// Sweep them instead — this is the common case, since a settled market is no
// longer "active" and so never shows up in a live watch:
//
//   CLAIM=1 npm start -w ec-settlement

import {
  createExchange,
  envNum,
  loadConfig,
  claimSettled,
  redeemHoldings,
  shutdown,
  activeMarkets,
  marketOnchain,
  outcomeSymbols,
  MARKET_STATUS,
  type EcContext,
  type UnifiedMarket,
} from "@dreamdex-bot-kit/ec-core";

const POLL_MS = envNum("WATCH_POLL_MS", 15_000);
// Interruptible sleep — wakes within ~500ms of the stop flag (see maker-bot).
const sleep = async (ms: number, stopped?: () => boolean) => {
  for (let t = 0; t < ms; t += 500) {
    if (stopped?.()) return;
    await new Promise((r) => setTimeout(r, Math.min(500, ms - t)));
  }
};
const log = (s: string) => console.log(`${new Date().toISOString()} ${s}`);
const statusName = (s: number) => Object.keys(MARKET_STATUS).find((k) => MARKET_STATUS[k as keyof typeof MARKET_STATUS] === s) ?? String(s);

async function pickMarket(ctx: EcContext): Promise<UnifiedMarket | null> {
  const want = process.env.EC_MARKET;
  const markets = await activeMarkets(ctx, { max: 50 });
  if (want) return markets.find((m) => m.symbol === want) ?? null;
  return markets[0] ?? null;
}


async function main() {
  const ctx = createExchange({ withSigner: Boolean(loadConfig().privateKey) });

  if (process.env.CLAIM === "1") {
    await claimSettled(ctx, { scan: envNum("CLAIM_SCAN", 25), verbose: true });
    await shutdown(ctx);
    return;
  }

  const market = await pickMarket(ctx);
  if (!market) {
    console.log("No market to watch.");
    await shutdown(ctx);
    return;
  }
  const { yes, no } = outcomeSymbols(market);
  log(`watching ${market.symbol}  (YES=${yes} NO=${no})`);

  let last = -1;
  let stop = false;
  process.on("SIGINT", () => (stop = true));
  process.on("SIGTERM", () => (stop = true));

  while (!stop) {
    const onchain = await marketOnchain(ctx, market);
    if (onchain) {
      if (onchain.status !== last) {
        log(`status → ${statusName(onchain.status)}`);
        last = onchain.status;
      }
      if (onchain.isResolved || onchain.isVoided) {
        const outcome = onchain.isVoided ? "VOID (both 0.5)" : `${onchain.winningOutcome === 0 ? "YES" : "NO"} wins`;
        log(`settled: ${outcome}`);
        await redeemHoldings(ctx, market, onchain);
        break;
      }
    }
    if (stop) break;
    await sleep(POLL_MS, () => stop);
  }

  await shutdown(ctx);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
