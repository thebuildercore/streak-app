/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { hybridTopOfBook } from "../book/hybrid.js";
import { FillEngine } from "./fill-engine.js";
import { buildQueueContext } from "./queue-model.js";
/**
 * Simulated Pool for backtests. Strategies call the same surface as live Pool.
 */
export class SimPool {
    symbol;
    tick;
    lot;
    minQty;
    book = {};
    candle = null;
    engine;
    ledger;
    bookOpts;
    queueOpts;
    queueCtx;
    constructor(opts) {
        this.symbol = opts.symbol;
        this.tick = opts.meta.tick;
        this.lot = opts.meta.lot;
        this.minQty = opts.meta.minQty;
        this.ledger = opts.ledger;
        this.bookOpts = opts.bookOpts ?? {};
        this.queueOpts = opts.queuePosition;
        this.engine = new FillEngine(opts.fillOpts);
    }
    /** Advance simulation to this candle's book (and match resting orders). */
    setCandle(candle) {
        this.candle = candle;
        this.book = hybridTopOfBook(candle, this.bookOpts);
        this.queueCtx = this.queueOpts?.enabled
            ? buildQueueContext(candle, {
                ...this.bookOpts,
                ...this.queueOpts.depth,
                tick: this.tick,
                qtyFloor: Math.max(this.lot, this.minQty, 1e-12),
            })
            : undefined;
        const fills = this.engine.matchRestingAgainstBar(candle, this.queueCtx);
        for (const f of fills)
            this.ledger.applyFill(f);
    }
    currentBook() {
        return this.book;
    }
    async topOfBook(_depth = 1) {
        return { ...this.book };
    }
    async place(args) {
        if (!this.candle)
            throw new Error("SimPool: no candle set");
        // Align loosely to lot/min (strategies already size carefully)
        if (args.qty < this.minQty) {
            throw new Error(`qty ${args.qty} below minQty ${this.minQty}`);
        }
        const result = this.engine.place(args, this.book, this.candle, this.queueCtx);
        if (result.rejected) {
            throw new Error(result.rejected);
        }
        for (const f of result.fills)
            this.ledger.applyFill(f);
        const txHash = (`0x${result.orderId.toString(16).padStart(64, "0")}`);
        return { txHash, orderId: result.orderId, gasUsed: 0n };
    }
    async cancel(orderId) {
        this.engine.cancel(orderId);
        return (`0x${orderId.toString(16).padStart(64, "0")}`);
    }
    async walletBase() {
        return this.ledger.base;
    }
    async walletQuote() {
        return this.ledger.quote;
    }
}
//# sourceMappingURL=sim-pool.js.map