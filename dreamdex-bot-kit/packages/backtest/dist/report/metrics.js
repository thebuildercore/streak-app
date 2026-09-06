/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
export function computeMetrics(input) {
    const { initialEquity, finalEquity, ledger, equityCurve } = input;
    const totalPnl = finalEquity - initialEquity;
    const totalPnlPct = initialEquity > 0 ? totalPnl / initialEquity : 0;
    // Round-trip win rate: pair consecutive buy then sell fills roughly
    const fills = ledger.fills;
    let wins = 0;
    let closed = 0;
    let entry;
    for (const f of fills) {
        if (f.isBid) {
            entry = { price: f.price, qty: f.qty };
        }
        else if (entry) {
            closed += 1;
            if (f.price > entry.price)
                wins += 1;
            entry = undefined;
        }
    }
    const winRate = closed > 0 ? wins / closed : null;
    let peak = initialEquity;
    let maxDd = 0;
    let maxDdPct = 0;
    for (const pt of equityCurve) {
        if (pt.equity > peak)
            peak = pt.equity;
        const dd = peak - pt.equity;
        if (dd > maxDd) {
            maxDd = dd;
            maxDdPct = peak > 0 ? dd / peak : 0;
        }
    }
    const returns = [];
    for (let i = 1; i < equityCurve.length; i++) {
        const prev = equityCurve[i - 1].equity;
        const cur = equityCurve[i].equity;
        if (prev > 0)
            returns.push((cur - prev) / prev);
    }
    let sharpe = null;
    if (returns.length > 1) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const var_ = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
        const std = Math.sqrt(var_);
        sharpe = std > 0 ? (mean / std) * Math.sqrt(returns.length) : null;
    }
    // Notional-weighted average markout so partial-fill fragmentation doesn't overweight dust.
    let markoutNotional = 0;
    let markoutWeighted = 0;
    let markoutSampleSize = 0;
    for (const f of fills) {
        if (f.markoutBps === undefined)
            continue;
        const notional = Math.abs(f.price * f.qty);
        if (!(notional > 0))
            continue;
        markoutNotional += notional;
        markoutWeighted += f.markoutBps * notional;
        markoutSampleSize += 1;
    }
    const avgMarkoutBps = markoutSampleSize > 0 ? markoutWeighted / markoutNotional : null;
    return {
        totalPnl,
        totalPnlPct,
        realizedPnl: ledger.realizedPnl,
        feesPaid: ledger.feesPaid,
        trades: fills.length,
        winRate,
        maxDrawdown: maxDd,
        maxDrawdownPct: maxDdPct,
        sharpe,
        finalEquity,
        finalBase: ledger.base,
        finalQuote: ledger.quote,
        avgMarkoutBps,
        markoutSampleSize,
    };
}
export function formatReviewTable(rows) {
    const pad = (s, n) => s.padEnd(n).slice(0, n);
    const lines = [
        "┌─────────────────┬──────────┬────────┬───────────┬──────────┬──────────┐",
        "│ bot             │ totalPnl │ trades │ maxDrawdn │ winRate  │ markout  │",
        "├─────────────────┼──────────┼────────┼───────────┼──────────┼──────────┤",
    ];
    for (const r of rows) {
        const m = r.metrics;
        const pnl = (m.totalPnl >= 0 ? "+" : "") + m.totalPnl.toFixed(2);
        const dd = (m.maxDrawdownPct * 100).toFixed(1) + "%";
        const wr = m.winRate === null ? "n/a" : `${(m.winRate * 100).toFixed(0)}%`;
        const mk = m.avgMarkoutBps === null || m.avgMarkoutBps === undefined
            ? "n/a"
            : `${m.avgMarkoutBps.toFixed(1)}bp`;
        lines.push(`│ ${pad(r.botId, 15)} │ ${pad(pnl, 8)} │ ${pad(String(m.trades), 6)} │ ${pad(dd, 9)} │ ${pad(wr, 8)} │ ${pad(mk, 8)} │`);
    }
    lines.push("└─────────────────┴──────────┴────────┴───────────┴──────────┴──────────┘");
    return lines.join("\n");
}
//# sourceMappingURL=metrics.js.map