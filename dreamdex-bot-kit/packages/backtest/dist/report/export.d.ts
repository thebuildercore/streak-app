/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { BacktestRunResult } from "../replay/runner.js";
import type { BacktestMetrics } from "./metrics.js";
type MetricsRow = {
    botId: string;
    candlesUsed?: number;
    warnings?: string[];
    metrics: BacktestMetrics;
};
export declare function formatJsonReport(results: MetricsRow[]): string;
export declare function formatCsvReport(results: MetricsRow[]): string;
export declare function exportJson(path: string, results: BacktestRunResult[]): Promise<void>;
/** CSV compatible with simple spreadsheet / edge-analytics style join. */
export declare function exportCsv(path: string, results: BacktestRunResult[]): Promise<void>;
export {};
//# sourceMappingURL=export.d.ts.map