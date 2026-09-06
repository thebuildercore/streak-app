/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
/** OHLCV candle from GET /v0/markets/{symbol}/candles */
export interface Candle {
    timestamp: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}
export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
export declare const INTERVAL_MS: Record<CandleInterval, number>;
export declare function parseCandleNums(c: Candle): {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};
//# sourceMappingURL=types.d.ts.map