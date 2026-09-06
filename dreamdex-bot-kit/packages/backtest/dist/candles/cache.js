/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
function cacheDir(opts = {}) {
    return opts.dir ?? path.join(process.cwd(), ".cache", "candles");
}
function cacheKey(symbol, interval, sinceMs, untilMs, network) {
    const raw = `${network}|${symbol}|${interval}|${sinceMs}|${untilMs}`;
    return createHash("sha256").update(raw).digest("hex").slice(0, 24);
}
function cachePath(symbol, interval, sinceMs, untilMs, network, opts = {}) {
    const key = cacheKey(symbol, interval, sinceMs, untilMs, network);
    const safeSymbol = symbol.replace(/[^a-zA-Z0-9:_-]/g, "_");
    return path.join(cacheDir(opts), `${safeSymbol}_${interval}_${key}.json`);
}
export function readCandleCache(symbol, interval, sinceMs, untilMs, network, opts = {}) {
    if (opts.disabled)
        return null;
    const file = cachePath(symbol, interval, sinceMs, untilMs, network, opts);
    if (!existsSync(file))
        return null;
    try {
        const raw = readFileSync(file, "utf8");
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.candles) ? parsed.candles : null;
    }
    catch {
        return null;
    }
}
export function writeCandleCache(symbol, interval, sinceMs, untilMs, network, candles, opts = {}) {
    if (opts.disabled)
        return;
    const dir = cacheDir(opts);
    mkdirSync(dir, { recursive: true });
    const file = cachePath(symbol, interval, sinceMs, untilMs, network, opts);
    writeFileSync(file, JSON.stringify({
        symbol,
        interval,
        sinceMs,
        untilMs,
        network,
        candles,
    }), "utf8");
}
//# sourceMappingURL=cache.js.map