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

export function serializeFill(f: SimFill): SerializedFill {
  return {
    orderId: f.orderId.toString(),
    isBid: f.isBid,
    price: f.price,
    qty: f.qty,
    fee: f.fee,
    timestamp: f.timestamp,
    role: f.role,
    ...(f.queueAheadQty !== undefined ? { queueAheadQty: f.queueAheadQty } : {}),
    ...(f.partial !== undefined ? { partial: f.partial } : {}),
    ...(f.markoutBps !== undefined ? { markoutBps: f.markoutBps } : {}),
    ...(f.markoutBars !== undefined ? { markoutBars: f.markoutBars } : {}),
  };
}

export function serializeRunResult(r: BacktestRunResult): SerializedBacktestRunResult {
  return {
    botId: r.botId,
    metrics: r.metrics,
    warnings: r.warnings,
    candlesUsed: r.candlesUsed,
    equityCurve: r.equityCurve,
    fills: r.fills?.map(serializeFill),
    candles: r.candles,
  };
}

export function serializeReviewResult(r: ReviewBotsResult): SerializedReviewResult {
  return {
    results: r.results.map(serializeRunResult),
    candles: r.candles,
  };
}

/** JSON.stringify replacer that converts bigint to string. */
export function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  return value;
}

export function toJsonSafe(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, jsonReplacer));
}
