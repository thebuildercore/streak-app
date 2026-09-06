/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { parseCandleNums } from "../candles/types.js";
/** Build a synthetic top-of-book from a single OHLCV candle. */
export function syntheticTopOfBook(candle, opts = {}) {
    const n = parseCandleNums(candle);
    const mid = opts.midMode === "hl2" ? (n.high + n.low) / 2 : n.close;
    if (!Number.isFinite(mid) || mid <= 0)
        return {};
    const spreadBps = opts.spreadBps ?? 10;
    const half = (mid * spreadBps) / 2 / 10_000;
    return {
        bestBid: mid - half,
        bestAsk: mid + half,
        mid,
    };
}
/**
 * Ambient (non-ours) resting quantity at `price`, k ticks from the synthetic touch.
 * Simple monotonic depth curve — not a research-grade LOB model.
 */
export function syntheticQuantityAtPrice(candle, isBid, price, tick, opts = {}) {
    if (!(tick > 0) || !Number.isFinite(price))
        return 0;
    const book = syntheticTopOfBook(candle, opts);
    const best = isBid ? book.bestBid : book.bestAsk;
    if (best === undefined || !Number.isFinite(best))
        return 0;
    const k = Math.max(0, Math.round(Math.abs(price - best) / tick));
    const n = parseCandleNums(candle);
    const baseFrac = opts.depthBaseFrac ?? 0.05;
    const decay = opts.depthDecay ?? 0.7;
    const floor = opts.qtyFloor ?? 1e-12;
    const baseQty = Math.max(n.volume * baseFrac, floor);
    return baseQty * decay ** k;
}
//# sourceMappingURL=synthetic.js.map