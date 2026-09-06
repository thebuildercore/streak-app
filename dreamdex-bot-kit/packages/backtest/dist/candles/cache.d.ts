/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { Candle, CandleInterval } from "./types.js";
export interface CandleCacheOptions {
    /** Directory for cache files. Default: `.cache/candles` under cwd. */
    dir?: string;
    /** When true, skip reading/writing the cache. */
    disabled?: boolean;
}
export declare function readCandleCache(symbol: string, interval: CandleInterval, sinceMs: number, untilMs: number, network: string, opts?: CandleCacheOptions): Candle[] | null;
export declare function writeCandleCache(symbol: string, interval: CandleInterval, sinceMs: number, untilMs: number, network: string, candles: Candle[], opts?: CandleCacheOptions): void;
//# sourceMappingURL=cache.d.ts.map