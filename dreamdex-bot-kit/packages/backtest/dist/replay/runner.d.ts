/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { NetworkName } from "@dreamdex-bot-kit/core";
import type { Candle, CandleInterval } from "../candles/types.js";
import { type CandleCacheOptions } from "../candles/cache.js";
import type { SyntheticDepthOptions } from "../book/synthetic.js";
import type { SimFill } from "../sim/fill-engine.js";
import type { BotFactory } from "../types.js";
import { type BacktestMetrics } from "../report/metrics.js";
export interface BacktestOptions {
    /** Label used in logs and reports (e.g. strategy id). */
    label: string;
    /** Factory that builds the strategy handle for this run. */
    createBot: BotFactory;
    symbol: string;
    interval: CandleInterval;
    since: number;
    until?: number;
    network?: NetworkName;
    spreadBps?: number;
    midMode?: "close" | "hl2";
    quoteUsdso?: number;
    base?: number;
    takerFeeBps?: number;
    makerFeeBps?: number;
    slippageBps?: number;
    calibrateLive?: boolean;
    depthDir?: string;
    /** Pre-fetched candles (skips network + cache). */
    candles?: Candle[];
    quiet?: boolean;
    /** Include equity curve, fills, and candles in the result (for UI). Default false. */
    includeDetails?: boolean;
    /**
     * Opt-in estimated queue-position modeling (changes fill qty/timing).
     * Uses candle volume + causal recorded depth when available.
     */
    queuePosition?: boolean;
    /** Knobs for synthetic depth curve when queuePosition is enabled. */
    queueDepthOptions?: SyntheticDepthOptions;
    /**
     * Forward markout horizon in bars for maker fills. Default 5.
     * Set to 0 to disable. Purely additive reporting — does not affect fills/PnL.
     */
    markoutBars?: number;
    /** Disk candle cache options. Pass `{ disabled: true }` to force a fresh fetch. */
    candleCache?: CandleCacheOptions;
}
export interface EquityPoint {
    t: number;
    equity: number;
}
export interface BacktestRunResult {
    botId: string;
    metrics: BacktestMetrics;
    warnings: string[];
    candlesUsed: number;
    equityCurve?: EquityPoint[];
    fills?: SimFill[];
    candles?: Candle[];
}
export interface ReviewBotsResult {
    results: BacktestRunResult[];
    /** Shared candle series when includeDetails is true (avoid N× duplication). */
    candles?: Candle[];
}
export interface ReviewBotSpec {
    label: string;
    createBot: BotFactory;
}
export declare function backtest(opts: BacktestOptions): Promise<BacktestRunResult>;
/** Run several bots on the same candle series (fair comparison). */
export declare function reviewBots(opts: Omit<BacktestOptions, "label" | "createBot"> & {
    bots: ReviewBotSpec[];
}): Promise<ReviewBotsResult>;
//# sourceMappingURL=runner.d.ts.map