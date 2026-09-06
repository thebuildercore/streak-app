/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import type { TopOfBook } from "@dreamdex-bot-kit/core";
import type { Candle } from "../candles/types.js";
import { parseCandleNums } from "../candles/types.js";

export type MidMode = "close" | "hl2";

export interface SyntheticBookOptions {
  /** Half-spread in bps of mid (full spread = 2×). Default 10. */
  spreadBps?: number;
  midMode?: MidMode;
}

export interface SyntheticDepthOptions extends SyntheticBookOptions {
  /**
   * Per-tick-step decay away from the touch. Default 0.7.
   * Tune per-market if estimated queue fills feel too fast/slow.
   */
  depthDecay?: number;
  /**
   * Fraction of candle.volume assumed resting at the touch. Default 0.05.
   * Tune per-market if estimated queue fills feel too fast/slow.
   */
  depthBaseFrac?: number;
  /** Quantity-unit floor (lot / minQty). Never use price tick here. Default 1e-12. */
  qtyFloor?: number;
}

/** Build a synthetic top-of-book from a single OHLCV candle. */
export function syntheticTopOfBook(candle: Candle, opts: SyntheticBookOptions = {}): TopOfBook {
  const n = parseCandleNums(candle);
  const mid = opts.midMode === "hl2" ? (n.high + n.low) / 2 : n.close;
  if (!Number.isFinite(mid) || mid <= 0) return {};
  const spreadBps = opts.spreadBps ?? 10;
  const half = (mid * spreadBps) / 2 / 10_000;
  return {
    bestBid: mid - half,
    bestAsk: mid + half,
    mid,
  };
}

/**
 * Ambient (non-ours) resting quantity at `price`, k ticks from the synthetic touch.
 * Simple monotonic depth curve — not a research-grade LOB model.
 */
export function syntheticQuantityAtPrice(
  candle: Candle,
  isBid: boolean,
  price: number,
  tick: number,
  opts: SyntheticDepthOptions = {},
): number {
  if (!(tick > 0) || !Number.isFinite(price)) return 0;
  const book = syntheticTopOfBook(candle, opts);
  const best = isBid ? book.bestBid : book.bestAsk;
  if (best === undefined || !Number.isFinite(best)) return 0;

  const k = Math.max(0, Math.round(Math.abs(price - best) / tick));
  const n = parseCandleNums(candle);
  const baseFrac = opts.depthBaseFrac ?? 0.05;
  const decay = opts.depthDecay ?? 0.7;
  const floor = opts.qtyFloor ?? 1e-12;
  const baseQty = Math.max(n.volume * baseFrac, floor);
  return baseQty * decay ** k;
}
