/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// starter-bot — the smallest complete TAKER. Each cycle it walks the DreamDEX
// venue's active markets and crosses a resting quote (buy YES cheap / sell YES
// rich) to generate a fill. It's the "hello world" of trading the venue:
//
//   • gate on the AUTHORITATIVE on-chain status (never the lagging indexer)
//   • seed inventory once via mint-a-pair so SELLs are collateralised
//   • trade by SYMBOL in human units — the SDK handles ERC-6909 escrow
//
// DRY_RUN=true (the default) logs intended crosses without sending them. Set
// DRY_RUN=false + a funded PRIVATE_KEY (that DIFFERS from any quoter — self-match
// is blocked) to trade for real.
//
//   npm start -w ec-starter

import {
  createExchange,
  envNum,
  cancelTracked,
  cancelVenueOrders,
  maybeClaim,
  loadConfig,
  shutdown,
  activeMarkets,
  explainEmptyScope,
  marketOnchain,
  isTradable,
  minLeftSec,
  netPosition,
  outcomeSymbols,
  seedInventory,
  quantize,
  assertProbability,
  clampProbability,
  placeLimit,
  sellableSize,
  type EcContext,
  type UnifiedMarket,
} from "@dreamdex-bot-kit/ec-core";
import { isBinaryMarket } from "@somnia-chain/markets-sdk";

const INTERVAL_MS = envNum("TAKE_INTERVAL_MS", 8_000);
// Every other strategy caps how far it can lean; this one had no limit at all,
// so a bot left running accumulated one-sided exposure indefinitely. The cap is
// on NET inventory per market: a complete set carries no directional risk.
const MAX_POSITION = envNum("TAKE_MAX_POSITION", 20);
const MAX_SHARES = envNum("TAKE_MAX_SHARES", 5);
// Interruptible sleep — wakes within ~500ms of the stop flag (see maker-bot).
const sleep = async (ms: number, stopped?: () => boolean) => {
  for (let t = 0; t < ms; t += 500) {
    if (stopped?.()) return;
    await new Promise((r) => setTimeout(r, Math.min(500, ms - t)));
  }
};
const log = (s: string) => console.log(`${new Date().toISOString()} ${s}`);

// Track which markets we've seeded, keyed by the stable SYMBOL (never a pool
// address — v2 recycles one pool across successive markets).
const seeded = new Set<string>();

// Trade one underlying only, or leave it blank for whatever the venue runs.
// ec-passive and ec-laddering-bot have always honoured this; these two did not,
// so a config that said BTC quietly traded ETH as well.
const UNDERLYING = (process.env.EC_UNDERLYING ?? "").toUpperCase();

async function takeOne(ctx: EcContext, market: UnifiedMarket): Promise<void> {
  if (UNDERLYING && !market.symbol.toUpperCase().includes(UNDERLYING)) return;
  // 1) Authoritative status. Resolve by marketId; act only on this snapshot.
  const onchain = await marketOnchain(ctx, market);
  if (!onchain) return;
  if (!isTradable(onchain)) {
    seeded.delete(market.symbol); // pool may recycle → re-seed under the next market
    return;
  }

  // Do not act on a window about to close. The other three strategies gate on
  // this; these two did not, and both of today's on-chain reverts landed on the
  // expiry second of the market they were sent to. Scaled to the cadence, so a
  // 60s series is not rejected outright.
  const interval = isBinaryMarket(market.info) ? Number(market.info.intervalSec ?? 0) : 0;
  if (Number(onchain.expiry) - Date.now() / 1000 < minLeftSec(interval || null)) return;

  // 2) Seed inventory once so a SELL cross is collateralised (mint-a-pair).
  if (!seeded.has(market.symbol)) {
    if (!ctx.config.dryRun) await seedInventory(ctx, market, onchain);
    seeded.add(market.symbol);
  }

  // 3) Read the YES book (human units; price = YES probability in (0,1)).
  const { yes } = outcomeSymbols(market);
  const ob = await ctx.exchange.fetchOrderBook(yes, 3);
  const canBuy = ob.asks.length > 0;
  const canSell = ob.bids.length > 0;
  if (!canBuy && !canSell) return;

  const net = await netPosition(ctx, onchain);
  if (Math.abs(net) >= MAX_POSITION) return; // at the cap on this market
  const buy = canBuy && (!canSell || Math.random() < 0.5);
  const top = buy ? ob.asks[0] : ob.bids[0];
  if (!top) return;
  const [bestPrice, bestAmount] = top;
  // Snap to the venue's lot grid — the book rejects off-grid sizes outright.
  // A sell is additionally capped by what we hold: the seeded inventory
  // (MM_INVENTORY, 1 share on mainnet) is smaller than the default trade size,
  // and there is no naked short.
  const wanted = Math.min(bestAmount, MAX_SHARES);
  const shares = buy
    ? quantize(ctx, wanted)
    : await sellableSize(ctx, onchain, "YES", wanted);
  if (shares <= 0) return; // nothing to trade at this size

  // Cross a touch past the best so we match even if the book shifts. placeLimit
  // snaps to the tick grid as integers; a float price reverts on an 18-decimal
  // venue.
  const price = clampProbability(buy ? bestPrice + 0.002 : bestPrice - 0.002);
  assertProbability(price);

  if (ctx.config.dryRun) {
    log(`DRY ${buy ? "buy" : "sell"} ${shares} ${yes} @ ~${price.toFixed(3)}`);
    return;
  }
  await placeLimit(ctx, {
    market, onchain, outcome: "YES", side: buy ? "buy" : "sell",
    // IOC, not limit: this bot crosses the touch, and a `limit` leaves the
    // unfilled remainder resting with escrow locked — invisibly, unless someone
    // is tracking open orders. Sharp edge 4 says the choice must be deliberate,
    // and for a taker the deliberate choice is to take.
    price, size: shares, type: "ioc",
  });
  log(`${buy ? "buy" : "sell"} ${shares} ${yes} @ ~${price.toFixed(3)}`);
}

// Explaining an empty venue every cycle would drown the log; once a minute is
// enough to be noticed and not enough to be noise.
const EMPTY_HINT_MS = 60_000;
let lastEmptyAt = 0;


async function main() {
  // A signer is only needed to actually send orders. In DRY_RUN you can watch
  // the bot reason about live books with no key at all.
  const ctx = createExchange({ withSigner: !loadConfig().dryRun });
  log(`starter-bot up as ${ctx.exchange.walletAddress ?? "(no key, dry run)"} · dryRun=${ctx.config.dryRun} · interval=${INTERVAL_MS}ms`);

  let stop = false;
  process.on("SIGINT", () => (stop = true));
  process.on("SIGTERM", () => (stop = true));

  while (!stop) {
    try {
      // Collect anything that settled since the last pass. Self-throttled
      // (AUTO_CLAIM_INTERVAL_MS) and a no-op under AUTO_CLAIM=false.
      await maybeClaim(ctx);
      const markets = await activeMarkets(ctx);
      if (markets.length === 0) {
        const now = Date.now();
        if (now - lastEmptyAt >= EMPTY_HINT_MS) {
          lastEmptyAt = now;
          log(`no market to trade — ${await explainEmptyScope(ctx)}`);
        }
      }
      for (const m of markets) {
        if (stop) break;
        try {
          await takeOne(ctx, m);
        } catch (e) {
          log(`${m.symbol} error: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      log(`cycle error: ${(e as Error).message}`);
    }
    if (stop) break;
    await sleep(INTERVAL_MS, () => stop);
  }

  // An unfilled cross rests on the book, so clean up before leaving.
  //
  // Cancel what WE placed, from our own record. Asking the indexer instead
  // reports zero: it is seconds behind, and the orders that need cancelling are
  // exactly the ones sent seconds ago. Measured — a run that left 3 orders
  // behind logged "canceled 0".
  if (!ctx.config.dryRun) {
    // Two steps, because tracking alone is not enough. An order can rest
    // on-chain while the SDK call that placed it throws on the way back — seen
    // on mainnet as "Missing or invalid parameters", after which there is no id
    // to remember. The record covers the common case immediately; the sweep
    // catches whatever the record could not know about.
    const { cancelled, tracked } = await cancelTracked(ctx);
    let swept = 0;
    try {
      swept = await cancelVenueOrders(ctx);
    } catch (e) {
      log(`shutdown sweep failed: ${(e as Error).message}`);
    }
    log(`canceled ${cancelled} of ${tracked} tracked + ${swept} swept on shutdown`);
  }

  await shutdown(ctx);
  log("starter-bot stopped");
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
