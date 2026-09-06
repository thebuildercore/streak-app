/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { NetworkName } from "@dreamdex-bot-kit/core";
import type { Candle, CandleInterval } from "./types.js";
export interface FetchCandlesOptions {
    network?: NetworkName;
    restApi?: string;
    signal?: AbortSignal;
}
/** Single-page candle fetch (max 1000). Public — no auth. */
export declare function fetchCandles(symbol: string, interval: CandleInterval, limit?: number, opts?: FetchCandlesOptions & {
    endTime?: number;
}): Promise<Candle[]>;
/**
 * Page backwards with `endTime` until `[sinceMs, untilMs)` is covered.
 * Returns ascending-by-timestamp candles in the window.
 */
export declare function fetchCandlesRange(symbol: string, interval: CandleInterval, sinceMs: number, untilMs: number, opts?: FetchCandlesOptions): Promise<Candle[]>;
/** Fetch markets list (for tick/lot/minQuantity). */
export declare function fetchMarkets(opts?: FetchCandlesOptions): Promise<Array<{
    symbol: string;
    tickSize: string;
    lotSize: string;
    minQuantity: string;
    baseDecimals: number;
    quoteDecimals: number;
}>>;
/** Optional ticker snapshot for pre-flight liveness warnings. */
export declare function fetchTickers(symbols: string[] | undefined, opts?: FetchCandlesOptions): Promise<Array<{
    symbol: string;
    lastTradeAt: number | null;
    volume: string;
}>>;
//# sourceMappingURL=fetch.d.ts.map