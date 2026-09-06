/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { hybridTopOfBook } from "../book/hybrid.js";
/**
 * Mutates maker fills in place, adding markoutBps / markoutBars where computable.
 *
 * Sign convention (conventional PnL): positive = favorable to the maker,
 * negative = adversely selected. Bid fill followed by rising mid ⇒ positive;
 * ask fill followed by rising mid ⇒ negative.
 *
 * Future mid is resolved at fillTimestamp + bars * intervalMs (exact candle
 * timestamp match). Missing target candles leave markout undefined.
 */
export function computeMarkouts(fills, candles, opts) {
    if (opts.bars <= 0 || opts.intervalMs <= 0)
        return;
    const idxByTs = new Map();
    for (let i = 0; i < candles.length; i++) {
        idxByTs.set(candles[i].timestamp, i);
    }
    for (const f of fills) {
        if (f.role !== "maker")
            continue;
        if (!(f.price > 0))
            continue;
        const targetTs = f.timestamp + opts.bars * opts.intervalMs;
        const targetIdx = idxByTs.get(targetTs);
        if (targetIdx === undefined)
            continue;
        const futureMid = hybridTopOfBook(candles[targetIdx], opts.bookOpts ?? {}).mid;
        if (!futureMid || futureMid <= 0)
            continue;
        const side = f.isBid ? 1 : -1;
        f.markoutBps = (side * (futureMid - f.price) / f.price) * 10_000;
        f.markoutBars = opts.bars;
    }
}
//# sourceMappingURL=markout.js.map