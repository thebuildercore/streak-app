/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { TopOfBook } from "@dreamdex-bot-kit/core";
import type { Candle } from "../candles/types.js";
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
export declare function syntheticTopOfBook(candle: Candle, opts?: SyntheticBookOptions): TopOfBook;
/**
 * Ambient (non-ours) resting quantity at `price`, k ticks from the synthetic touch.
 * Simple monotonic depth curve — not a research-grade LOB model.
 */
export declare function syntheticQuantityAtPrice(candle: Candle, isBid: boolean, price: number, tick: number, opts?: SyntheticDepthOptions): number;
//# sourceMappingURL=synthetic.d.ts.map