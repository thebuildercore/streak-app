/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
export function serializeFill(f) {
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
export function serializeRunResult(r) {
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
export function serializeReviewResult(r) {
    return {
        results: r.results.map(serializeRunResult),
        candles: r.candles,
    };
}
/** JSON.stringify replacer that converts bigint to string. */
export function jsonReplacer(_key, value) {
    if (typeof value === "bigint")
        return value.toString();
    return value;
}
export function toJsonSafe(value) {
    return JSON.parse(JSON.stringify(value, jsonReplacer));
}
//# sourceMappingURL=serialize.js.map