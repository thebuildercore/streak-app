/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { NETWORKS } from "@dreamdex-bot-kit/core";
const PAGE_LIMIT = 1000;
function restBase(opts = {}) {
    if (opts.restApi)
        return opts.restApi.replace(/\/$/, "");
    const net = NETWORKS[opts.network ?? "mainnet"];
    return net.restApi;
}
/** Single-page candle fetch (max 1000). Public — no auth. */
export async function fetchCandles(symbol, interval, limit = PAGE_LIMIT, opts = {}) {
    const capped = Math.min(Math.max(1, limit), PAGE_LIMIT);
    const params = new URLSearchParams({ interval, limit: String(capped) });
    if (opts.endTime !== undefined)
        params.set("endTime", String(opts.endTime));
    const url = `${restBase(opts)}/markets/${encodeURIComponent(symbol)}/candles?${params}`;
    const res = await fetch(url, {
        headers: { Accept: "application/json", "Cache-Control": "no-cache" },
        signal: opts.signal,
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : {};
    if (!res.ok) {
        throw new Error(`candles ${res.status}: ${body.name ?? res.statusText} ${body.description ?? text.slice(0, 200)}`);
    }
    return body.candles ?? [];
}
/**
 * Page backwards with `endTime` until `[sinceMs, untilMs)` is covered.
 * Returns ascending-by-timestamp candles in the window.
 */
export async function fetchCandlesRange(symbol, interval, sinceMs, untilMs, opts = {}) {
    if (!(sinceMs < untilMs)) {
        throw new Error(`sinceMs (${sinceMs}) must be < untilMs (${untilMs})`);
    }
    const collected = [];
    let endTime = untilMs;
    for (let page = 0; page < 200; page++) {
        const batch = await fetchCandles(symbol, interval, PAGE_LIMIT, { ...opts, endTime });
        if (batch.length === 0)
            break;
        collected.push(...batch);
        const oldest = Math.min(...batch.map((c) => c.timestamp));
        if (oldest <= sinceMs)
            break;
        if (batch.length < PAGE_LIMIT)
            break;
        endTime = oldest;
    }
    // Deduplicate by timestamp (overlapping pages shouldn't happen, but be safe)
    const byTs = new Map();
    for (const c of collected) {
        if (c.timestamp >= sinceMs && c.timestamp < untilMs)
            byTs.set(c.timestamp, c);
    }
    return [...byTs.values()].sort((a, b) => a.timestamp - b.timestamp);
}
/** Fetch markets list (for tick/lot/minQuantity). */
export async function fetchMarkets(opts = {}) {
    const url = `${restBase(opts)}/markets`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: opts.signal });
    if (!res.ok)
        throw new Error(`markets ${res.status}: ${await res.text()}`);
    const body = (await res.json());
    return (body.markets ?? []).map((m) => ({
        symbol: String(m.symbol),
        tickSize: String(m.tickSize),
        lotSize: String(m.lotSize),
        minQuantity: String(m.minQuantity),
        baseDecimals: Number(m.baseDecimals),
        quoteDecimals: Number(m.quoteDecimals),
    }));
}
/** Optional ticker snapshot for pre-flight liveness warnings. */
export async function fetchTickers(symbols, opts = {}) {
    const params = new URLSearchParams();
    if (symbols)
        for (const s of symbols)
            params.append("symbols", s);
    const q = params.toString();
    const url = `${restBase(opts)}/tickers${q ? `?${q}` : ""}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: opts.signal });
    if (!res.ok)
        throw new Error(`tickers ${res.status}: ${await res.text()}`);
    const body = (await res.json());
    return body.symbols ?? [];
}
//# sourceMappingURL=fetch.js.map