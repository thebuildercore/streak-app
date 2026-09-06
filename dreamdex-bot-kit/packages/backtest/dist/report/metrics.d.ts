/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { PortfolioLedger } from "../sim/ledger.js";
export interface BacktestMetrics {
    totalPnl: number;
    totalPnlPct: number;
    realizedPnl: number;
    feesPaid: number;
    trades: number;
    winRate: number | null;
    maxDrawdown: number;
    maxDrawdownPct: number;
    sharpe: number | null;
    finalEquity: number;
    finalBase: number;
    finalQuote: number;
    /**
     * Notional-weighted average maker markout (bps).
     * Conventional PnL sign: positive = favorable, negative = adverse.
     * null when no maker fills have computable markout.
     */
    avgMarkoutBps: number | null;
    /** Number of maker fills included in avgMarkoutBps. */
    markoutSampleSize: number;
    /**
     * Own-order relative yield score (qty × W × seconds), when a strategy reports it.
     * Not a predicted USDso payout — competing makers' share is unknown in candle replay.
     */
    estYieldScore?: number;
}
export declare function computeMetrics(input: {
    initialEquity: number;
    finalEquity: number;
    ledger: PortfolioLedger;
    equityCurve: Array<{
        t: number;
        equity: number;
    }>;
    lastMid: number;
}): BacktestMetrics;
export declare function formatReviewTable(rows: Array<{
    botId: string;
    metrics: BacktestMetrics;
}>): string;
//# sourceMappingURL=metrics.d.ts.map