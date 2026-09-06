/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { Candle } from "../candles/types.js";
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
export declare function volumeThroughPriceSynthetic(candle: Candle, price: number, isBid: boolean, tick: number): number;
/** Build a queue-fill context for one candle (stateless volume lookup). */
export declare function buildQueueContext(candle: Candle, opts: QueueModelOptions): QueueFillContext;
//# sourceMappingURL=queue-model.d.ts.map