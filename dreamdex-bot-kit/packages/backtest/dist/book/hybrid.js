/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { syntheticQuantityAtPrice, syntheticTopOfBook, } from "./synthetic.js";
import { latestSnapshotAtOrBefore, nearestSnapshot, } from "./depth-overlay.js";
/** Prefer recorded depth when available; otherwise synthetic mid ± spread. */
export function hybridTopOfBook(candle, opts = {}) {
    const spreadBps = opts.calibratedSpreadBps ?? opts.spreadBps;
    if (opts.snapshots && opts.snapshots.size > 0) {
        const snap = nearestSnapshot(opts.snapshots, candle.timestamp, opts.snapshotToleranceMs);
        if (snap?.bids[0] && snap?.asks[0]) {
            const bestBid = snap.bids[0].price;
            const bestAsk = snap.asks[0].price;
            return { bestBid, bestAsk, mid: (bestBid + bestAsk) / 2 };
        }
    }
    return syntheticTopOfBook(candle, { ...opts, spreadBps });
}
/**
 * Ambient resting quantity at `price` for queue-position estimates.
 * Prefers a causal recorded snapshot level; falls back to synthetic depth.
 */
export function depthAheadAt(candle, isBid, price, tick, opts = {}) {
    if (opts.snapshots && opts.snapshots.size > 0) {
        const snap = latestSnapshotAtOrBefore(opts.snapshots, candle.timestamp, opts.snapshotToleranceMs);
        const levels = isBid ? snap?.bids : snap?.asks;
        const hit = levels?.find((l) => Math.abs(l.price - price) < tick / 2);
        if (hit)
            return hit.quantity;
    }
    const spreadBps = opts.calibratedSpreadBps ?? opts.spreadBps;
    return syntheticQuantityAtPrice(candle, isBid, price, tick, { ...opts, spreadBps });
}
//# sourceMappingURL=hybrid.js.map