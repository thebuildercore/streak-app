/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { Candle } from "../candles/types.js";
import type { SimFill } from "../sim/fill-engine.js";
import type { BacktestRunResult, EquityPoint, ReviewBotsResult } from "../replay/runner.js";
/** JSON-safe fill (bigint orderId → string). */
export interface SerializedFill {
    orderId: string;
    isBid: boolean;
    price: number;
    qty: number;
    fee: number;
    timestamp: number;
    role: "taker" | "maker";
    queueAheadQty?: number;
    partial?: boolean;
    markoutBps?: number;
    markoutBars?: number;
}
export interface SerializedBacktestRunResult {
    botId: BacktestRunResult["botId"];
    metrics: BacktestRunResult["metrics"];
    warnings: string[];
    candlesUsed: number;
    equityCurve?: EquityPoint[];
    fills?: SerializedFill[];
    candles?: Candle[];
}
export interface SerializedReviewResult {
    results: SerializedBacktestRunResult[];
    candles?: Candle[];
}
export declare function serializeFill(f: SimFill): SerializedFill;
export declare function serializeRunResult(r: BacktestRunResult): SerializedBacktestRunResult;
export declare function serializeReviewResult(r: ReviewBotsResult): SerializedReviewResult;
/** JSON.stringify replacer that converts bigint to string. */
export declare function jsonReplacer(_key: string, value: unknown): unknown;
export declare function toJsonSafe(value: unknown): unknown;
//# sourceMappingURL=serialize.d.ts.map