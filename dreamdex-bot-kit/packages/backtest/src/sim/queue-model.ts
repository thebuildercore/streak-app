/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import type { Candle } from "../candles/types.js";
import { parseCandleNums } from "../candles/types.js";
import { depthAheadAt } from "../book/hybrid.js";
import type { HybridBookOptions } from "../book/hybrid.js";
import type { SyntheticDepthOptions } from "../book/synthetic.js";
import type { QueueFillContext } from "./fill-engine.js";

export interface QueueModelOptions extends HybridBookOptions, SyntheticDepthOptions {
  tick: number;
  /** Quantity-unit floor (lot / minQty). */
  qtyFloor?: number;
}

/**
 * Estimate volume traded through price P during the candle.
 *
 * Spreads candle volume uniformly across tick-sized buckets in [low, high].
 * Bid at P: inclusive fraction of buckets from low through P.
 * Ask at P: inclusive fraction of buckets from P through high.
 * Degenerate high === low: returns full candle.volume (matches legacy "any touch = 100%").
 */
export function volumeThroughPriceSynthetic(
  candle: Candle,
  price: number,
  isBid: boolean,
  tick: number,
): number {
  const n = parseCandleNums(candle);
  if (!(n.volume > 0) || !Number.isFinite(price)) return 0;
  if (!(n.high > n.low) || !(tick > 0)) {
    // Flat bar or missing tick: any touch gets full volume (legacy limiting case).
    return n.volume;
  }

  // Inclusive tick buckets from low to high.
  const lowBucket = Math.round(n.low / tick);
  const highBucket = Math.round(n.high / tick);
  const priceBucket = Math.round(price / tick);
  const totalBuckets = highBucket - lowBucket + 1;
  if (totalBuckets <= 0) return n.volume;

  let throughBuckets: number;
  if (isBid) {
    // Sell prints at or below P walk the book down through the bid.
    if (priceBucket < lowBucket) return 0;
    throughBuckets = Math.min(priceBucket, highBucket) - lowBucket + 1;
  } else {
    // Buy prints at or above P walk the book up through the ask.
    if (priceBucket > highBucket) return 0;
    throughBuckets = highBucket - Math.max(priceBucket, lowBucket) + 1;
  }
  const fraction = Math.max(0, Math.min(1, throughBuckets / totalBuckets));
  return n.volume * fraction;
}

/** Build a queue-fill context for one candle (stateless volume lookup). */
export function buildQueueContext(candle: Candle, opts: QueueModelOptions): QueueFillContext {
  const qtyFloor = opts.qtyFloor ?? 1e-12;
  const depthOpts: HybridBookOptions & SyntheticDepthOptions = {
    ...opts,
    qtyFloor,
  };
  return {
    depthAheadAt(price: number, isBid: boolean): number {
      return depthAheadAt(candle, isBid, price, opts.tick, depthOpts);
    },
    volumeThroughPrice(price: number, isBid: boolean): number {
      return volumeThroughPriceSynthetic(candle, price, isBid, opts.tick);
    },
  };
}
