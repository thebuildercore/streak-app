/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

export type { Candle, CandleInterval } from "./candles/types.js";
export { INTERVAL_MS, parseCandleNums } from "./candles/types.js";
export { fetchCandles, fetchCandlesRange, fetchMarkets, fetchTickers } from "./candles/fetch.js";
export {
  readCandleCache,
  writeCandleCache,
  type CandleCacheOptions,
} from "./candles/cache.js";
export {
  backtest,
  reviewBots,
  type BacktestOptions,
  type BacktestRunResult,
  type ReviewBotsResult,
  type ReviewBotSpec,
  type EquityPoint,
} from "./replay/runner.js";
export type { BotHandle, BotFactory, LogFn } from "./types.js";
export { computeMetrics, formatReviewTable, type BacktestMetrics } from "./report/metrics.js";
export { computeMarkouts, type MarkoutOptions } from "./report/markout.js";
export { exportJson, exportCsv, formatJsonReport, formatCsvReport } from "./report/export.js";
export {
  serializeFill,
  serializeRunResult,
  serializeReviewResult,
  jsonReplacer,
  toJsonSafe,
  type SerializedFill,
  type SerializedBacktestRunResult,
  type SerializedReviewResult,
} from "./report/serialize.js";
export { SimPool } from "./sim/sim-pool.js";
export { PortfolioLedger } from "./sim/ledger.js";
export { FillEngine } from "./sim/fill-engine.js";
export type { SimFill, QueueFillContext } from "./sim/fill-engine.js";
export { buildQueueContext, volumeThroughPriceSynthetic } from "./sim/queue-model.js";
export { depthAheadAt } from "./book/hybrid.js";
export { syntheticQuantityAtPrice, type SyntheticDepthOptions } from "./book/synthetic.js";
export {
  latestSnapshotAtOrBefore,
  calibrateLiveSpread,
  loadDepthSnapshots,
} from "./book/depth-overlay.js";
export type { PoolLike } from "./sim/pool-like.js";
export { asPool } from "./sim/pool-like.js";
export { applyConfigOverrides } from "./config-overrides.js";
