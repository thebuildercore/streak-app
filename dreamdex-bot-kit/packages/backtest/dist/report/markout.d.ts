/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { Candle } from "../candles/types.js";
import { type HybridBookOptions } from "../book/hybrid.js";
import type { SimFill } from "../sim/fill-engine.js";
export interface MarkoutOptions {
    /** Number of candle intervals forward. */
    bars: number;
    /** Interval length in ms (used for exact timestamp lookup). */
    intervalMs: number;
    bookOpts?: HybridBookOptions;
}
/**
 * Mutates maker fills in place, adding markoutBps / markoutBars where computable.
 *
 * Sign convention (conventional PnL): positive = favorable to the maker,
 * negative = adversely selected. Bid fill followed by rising mid ⇒ positive;
 * ask fill followed by rising mid ⇒ negative.
 *
 * Future mid is resolved at fillTimestamp + bars * intervalMs (exact candle
 * timestamp match). Missing target candles leave markout undefined.
 */
export declare function computeMarkouts(fills: SimFill[], candles: Candle[], opts: MarkoutOptions): void;
//# sourceMappingURL=markout.d.ts.map