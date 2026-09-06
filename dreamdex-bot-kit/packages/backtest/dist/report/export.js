/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { writeFile } from "node:fs/promises";
export function formatJsonReport(results) {
    const payload = {
        generatedAt: new Date().toISOString(),
        results: results.map((r) => ({
            botId: r.botId,
            candlesUsed: r.candlesUsed,
            warnings: r.warnings,
            metrics: r.metrics,
        })),
    };
    return JSON.stringify(payload, null, 2);
}
export function formatCsvReport(results) {
    const header = [
        "bot",
        "totalPnl",
        "totalPnlPct",
        "trades",
        "winRate",
        "maxDrawdownPct",
        "sharpe",
        "feesPaid",
        "finalEquity",
        "avgMarkoutBps",
        "markoutSampleSize",
        "estYieldScore",
    ].join(",");
    const lines = results.map((r) => {
        const m = r.metrics;
        return [
            r.botId,
            m.totalPnl.toFixed(6),
            m.totalPnlPct.toFixed(6),
            m.trades,
            m.winRate === null ? "" : m.winRate.toFixed(4),
            m.maxDrawdownPct.toFixed(6),
            m.sharpe === null ? "" : m.sharpe.toFixed(4),
            m.feesPaid.toFixed(6),
            m.finalEquity.toFixed(6),
            m.avgMarkoutBps == null ? "" : m.avgMarkoutBps.toFixed(4),
            m.markoutSampleSize ?? 0,
            m.estYieldScore == null ? "" : m.estYieldScore.toFixed(6),
        ].join(",");
    });
    return [header, ...lines].join("\n") + "\n";
}
export async function exportJson(path, results) {
    await writeFile(path, formatJsonReport(results), "utf8");
}
/** CSV compatible with simple spreadsheet / edge-analytics style join. */
export async function exportCsv(path, results) {
    await writeFile(path, formatCsvReport(results), "utf8");
}
//# sourceMappingURL=export.js.map