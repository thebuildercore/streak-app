/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { NETWORKS } from "@dreamdex-bot-kit/core";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
/**
 * Load depth snapshots from a directory of JSON files.
 * Filenames may be `{timestamp}.json` or any JSON with a `timestamp` field.
 */
export async function loadDepthSnapshots(dir) {
    const map = new Map();
    let files;
    try {
        files = await readdir(dir);
    }
    catch {
        return map;
    }
    for (const file of files) {
        if (!file.endsWith(".json"))
            continue;
        const raw = await readFile(path.join(dir, file), "utf8");
        const parsed = JSON.parse(raw);
        const fromName = Number(file.replace(/\.json$/, ""));
        const timestamp = parsed.timestamp ?? (Number.isFinite(fromName) ? fromName : NaN);
        if (!Number.isFinite(timestamp))
            continue;
        const bids = normalizeLevels(parsed.bids);
        const asks = normalizeLevels(parsed.asks);
        map.set(timestamp, { timestamp, bids, asks });
    }
    return map;
}
function normalizeLevels(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw
        .map((row) => {
        if (Array.isArray(row) && row.length >= 2) {
            return { price: Number(row[0]), quantity: Number(row[1]) };
        }
        if (row && typeof row === "object") {
            const o = row;
            return { price: Number(o.price), quantity: Number(o.quantity ?? o.qty) };
        }
        return { price: NaN, quantity: NaN };
    })
        .filter((l) => Number.isFinite(l.price) && Number.isFinite(l.quantity) && l.quantity > 0);
}
/**
 * Fetch live orderbook once and return observed spread (bps) + best bid/ask.
 * Uses repeated `symbols=` query keys per OpenAPI explode:true.
 */
export async function calibrateLiveSpread(symbol, network = "mainnet") {
    const base = NETWORKS[network].restApi;
    const params = new URLSearchParams();
    params.append("symbols", symbol);
    params.set("depth", "1");
    const res = await fetch(`${base}/orderbooks?${params}`);
    if (!res.ok)
        return null;
    const body = (await res.json());
    const book = body.orderbooks?.find((b) => b.symbol === symbol) ?? body.orderbooks?.[0];
    if (!book)
        return null;
    const bestBid = Number(book.bids?.[0]?.price);
    const bestAsk = Number(book.asks?.[0]?.price);
    if (!(bestBid > 0 && bestAsk > 0))
        return null;
    const mid = (bestBid + bestAsk) / 2;
    const spreadBps = ((bestAsk - bestBid) / mid) * 10_000;
    return { spreadBps, bestBid, bestAsk, mid };
}
/** Find the snapshot whose timestamp is closest to `ts` within `toleranceMs`. */
export function nearestSnapshot(snapshots, ts, toleranceMs = 60_000) {
    let best;
    let bestDist = Infinity;
    for (const [key, snap] of snapshots) {
        const d = Math.abs(key - ts);
        if (d < bestDist && d <= toleranceMs) {
            bestDist = d;
            best = snap;
        }
    }
    return best;
}
/**
 * Latest snapshot at or before `ts` within `toleranceMs` (causal — no future lookahead).
 * Prefer this for queue-position modeling.
 */
export function latestSnapshotAtOrBefore(snapshots, ts, toleranceMs = 60_000) {
    let best;
    let bestDist = Infinity;
    for (const [key, snap] of snapshots) {
        if (key > ts)
            continue;
        const d = ts - key;
        if (d < bestDist && d <= toleranceMs) {
            bestDist = d;
            best = snap;
        }
    }
    return best;
}
//# sourceMappingURL=depth-overlay.js.map