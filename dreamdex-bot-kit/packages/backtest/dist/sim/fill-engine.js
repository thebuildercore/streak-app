/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { ORDER_TYPE } from "@dreamdex-bot-kit/core";
import { parseCandleNums } from "../candles/types.js";
export class FillEngine {
    opts;
    nextId = 1n;
    resting = new Map();
    constructor(opts = {}) {
        this.opts = opts;
    }
    newOrderId() {
        const id = this.nextId;
        this.nextId += 1n;
        return id;
    }
    /**
     * Attempt to place. Returns fills for IOC (immediate), or rests PostOnly/Normal.
     * Rejects PostOnly that would cross.
     *
     * When `queueCtx` is provided, Normal/GTC remainder does **not** rematch against
     * the current bar (avoids double-counting bar volume). Maker fills land on the
     * next `matchRestingAgainstBar` call. Legacy path (no queueCtx) rematches as before.
     */
    place(args, book, candle, queueCtx) {
        const orderType = args.orderType ?? ORDER_TYPE.ImmediateOrCancel;
        const orderId = this.newOrderId();
        const ts = candle.timestamp;
        if (orderType === ORDER_TYPE.PostOnly) {
            if (args.isBid && book.bestAsk !== undefined && args.price >= book.bestAsk) {
                return { orderId, fills: [], rejected: "postOnly would cross ask" };
            }
            if (!args.isBid && book.bestBid !== undefined && args.price <= book.bestBid) {
                return { orderId, fills: [], rejected: "postOnly would cross bid" };
            }
            this.resting.set(orderId, this.buildResting(orderId, args, args.qty, queueCtx));
            return { orderId, fills: [] };
        }
        if (orderType === ORDER_TYPE.ImmediateOrCancel || orderType === ORDER_TYPE.FillOrKill) {
            const fills = this.tryCross(orderId, args, book, ts, "taker");
            if (orderType === ORDER_TYPE.FillOrKill && fills.reduce((s, f) => s + f.qty, 0) < args.qty - 1e-12) {
                return { orderId, fills: [], rejected: "FOK not fully filled" };
            }
            return { orderId, fills };
        }
        // Normal / GTC: try cross then rest remainder
        const fills = this.tryCross(orderId, args, book, ts, "taker");
        const filled = fills.reduce((s, f) => s + f.qty, 0);
        const rem = args.qty - filled;
        if (rem > 1e-12) {
            this.resting.set(orderId, this.buildResting(orderId, args, rem, queueCtx));
        }
        // Legacy: rematch resting against this bar after placement.
        // Queue mode: skip — bar volume is applied once in setCandle / matchRestingAgainstBar.
        if (!queueCtx) {
            const more = this.matchRestingAgainstBar(candle);
            return { orderId, fills: [...fills, ...more] };
        }
        return { orderId, fills };
    }
    cancel(orderId) {
        const removed = this.resting.get(orderId);
        if (!removed)
            return false;
        this.resting.delete(orderId);
        // Adjust later same-side/same-price own orders' queue-ahead so canceled qty
        // does not remain as phantom queue. orderIds are monotonic ⇒ later = larger id.
        if (removed.queueAheadQty !== undefined) {
            for (const o of this.resting.values()) {
                if (o.isBid === removed.isBid &&
                    o.price === removed.price &&
                    o.queueAheadQty !== undefined &&
                    o.orderId > removed.orderId) {
                    o.queueAheadQty = Math.max(0, o.queueAheadQty - removed.qty);
                }
            }
        }
        return true;
    }
    /** Match resting PostOnly/GTC against candle high/low for the bar. */
    matchRestingAgainstBar(candle, queueCtx) {
        const n = parseCandleNums(candle);
        const fills = [];
        for (const [id, o] of [...this.resting.entries()]) {
            let hit = false;
            let fillPrice = o.price;
            if (o.isBid && n.low <= o.price) {
                hit = true;
                fillPrice = o.price;
            }
            else if (!o.isBid && n.high >= o.price) {
                hit = true;
                fillPrice = o.price;
            }
            if (!hit)
                continue;
            let fillQty = o.qty; // legacy: unconditional full fill
            let aheadAtFill;
            if (queueCtx) {
                const traded = Math.max(0, queueCtx.volumeThroughPrice(o.price, o.isBid));
                const ahead = o.queueAheadQty ?? 0;
                aheadAtFill = ahead;
                fillQty = Math.min(o.qty, Math.max(0, traded - ahead));
                o.queueAheadQty = Math.max(0, ahead - traded);
                if (fillQty <= 1e-12)
                    continue; // still queued; stays resting
            }
            const feeBps = this.opts.makerFeeBps ?? 0;
            const notional = fillPrice * fillQty;
            const original = o.originalQty ?? o.qty;
            fills.push({
                orderId: id,
                isBid: o.isBid,
                price: fillPrice,
                qty: fillQty,
                fee: (notional * feeBps) / 10_000,
                timestamp: candle.timestamp,
                role: "maker",
                ...(queueCtx
                    ? {
                        queueAheadQty: aheadAtFill,
                        partial: fillQty < original - 1e-12,
                    }
                    : {}),
            });
            o.qty -= fillQty;
            if (o.qty <= 1e-12)
                this.resting.delete(id);
        }
        return fills;
    }
    buildResting(orderId, args, qty, queueCtx) {
        let queueAheadQty;
        if (queueCtx) {
            let ownAhead = 0;
            for (const o of this.resting.values()) {
                if (o.isBid === args.isBid && o.price === args.price)
                    ownAhead += o.qty;
            }
            queueAheadQty = queueCtx.depthAheadAt(args.price, args.isBid) + ownAhead;
        }
        return {
            orderId,
            isBid: args.isBid,
            price: args.price,
            qty,
            orderType: args.orderType ?? ORDER_TYPE.Normal,
            queueAheadQty,
            originalQty: queueCtx ? qty : undefined,
        };
    }
    tryCross(orderId, args, book, ts, role) {
        const slip = (this.opts.slippageBps ?? 0) / 10_000;
        const feeBps = role === "taker" ? (this.opts.takerFeeBps ?? 0) : (this.opts.makerFeeBps ?? 0);
        if (args.isBid) {
            if (book.bestAsk === undefined || args.price < book.bestAsk)
                return [];
            const price = Math.min(args.price, book.bestAsk) * (1 + slip);
            const notional = price * args.qty;
            return [
                {
                    orderId,
                    isBid: true,
                    price,
                    qty: args.qty,
                    fee: (notional * feeBps) / 10_000,
                    timestamp: ts,
                    role,
                },
            ];
        }
        if (book.bestBid === undefined || args.price > book.bestBid)
            return [];
        const price = Math.max(args.price, book.bestBid) * (1 - slip);
        const notional = price * args.qty;
        return [
            {
                orderId,
                isBid: false,
                price,
                qty: args.qty,
                fee: (notional * feeBps) / 10_000,
                timestamp: ts,
                role,
            },
        ];
    }
}
//# sourceMappingURL=fill-engine.js.map