/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import type { TopOfBook } from "@dreamdex-bot-kit/core";
import type { Candle } from "../candles/types.js";
import {
  syntheticQuantityAtPrice,
  syntheticTopOfBook,
  type SyntheticBookOptions,
  type SyntheticDepthOptions,
} from "./synthetic.js";
import {
  latestSnapshotAtOrBefore,
  nearestSnapshot,
  type DepthSnapshot,
} from "./depth-overlay.js";

export interface HybridBookOptions extends SyntheticBookOptions {
  snapshots?: Map<number, DepthSnapshot>;
  snapshotToleranceMs?: number;
  /** When set, override synthetic spread for the whole run (e.g. from live calibration). */
  calibratedSpreadBps?: number;
}

/** Prefer recorded depth when available; otherwise synthetic mid ± spread. */
export function hybridTopOfBook(candle: Candle, opts: HybridBookOptions = {}): TopOfBook {
  const spreadBps = opts.calibratedSpreadBps ?? opts.spreadBps;
  if (opts.snapshots && opts.snapshots.size > 0) {
    const snap = nearestSnapshot(opts.snapshots, candle.timestamp, opts.snapshotToleranceMs);
    if (snap?.bids[0] && snap?.asks[0]) {
      const bestBid = snap.bids[0].price;
      const bestAsk = snap.asks[0].price;
      return { bestBid, bestAsk, mid: (bestBid + bestAsk) / 2 };
    }
  }
  return syntheticTopOfBook(candle, { ...opts, spreadBps });
}

/**
 * Ambient resting quantity at `price` for queue-position estimates.
 * Prefers a causal recorded snapshot level; falls back to synthetic depth.
 */
export function depthAheadAt(
  candle: Candle,
  isBid: boolean,
  price: number,
  tick: number,
  opts: HybridBookOptions & SyntheticDepthOptions = {},
): number {
  if (opts.snapshots && opts.snapshots.size > 0) {
    const snap = latestSnapshotAtOrBefore(opts.snapshots, candle.timestamp, opts.snapshotToleranceMs);
    const levels = isBid ? snap?.bids : snap?.asks;
    const hit = levels?.find((l) => Math.abs(l.price - price) < tick / 2);
    if (hit) return hit.quantity;
  }
  const spreadBps = opts.calibratedSpreadBps ?? opts.spreadBps;
  return syntheticQuantityAtPrice(candle, isBid, price, tick, { ...opts, spreadBps });
}
