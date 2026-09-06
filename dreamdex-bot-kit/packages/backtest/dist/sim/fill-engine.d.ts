/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { PlaceArgs } from "./pool-like.js";
import type { Candle } from "../candles/types.js";
import type { TopOfBook } from "@dreamdex-bot-kit/core";
export interface RestingOrder {
    orderId: bigint;
    isBid: boolean;
    price: number;
    qty: number;
    orderType: number;
    /** Ambient + own-ahead qty at placement; undefined ⇒ legacy full-fill behavior. */
    queueAheadQty?: number;
    /** Original resting qty at placement (for partial diagnostics). */
    originalQty?: number;
}
export interface SimFill {
    orderId: bigint;
    isBid: boolean;
    price: number;
    qty: number;
    fee: number;
    timestamp: number;
    role: "taker" | "maker";
    /** Snapshot of ahead-qty at fill time (maker fills only). */
    queueAheadQty?: number;
    /** True if this fill does not fully consume the resting order's original qty. */
    partial?: boolean;
    /**
     * Forward markout in bps (maker fills only).
     * Conventional PnL sign: positive = favorable, negative = adverse.
     */
    markoutBps?: number;
    /** Horizon used for markoutBps. */
    markoutBars?: number;
}
export interface FillEngineOptions {
    takerFeeBps?: number;
    makerFeeBps?: number;
    slippageBps?: number;
}
/** Per-bar queue/volume inputs for opt-in queue-position modeling. */
export interface QueueFillContext {
    depthAheadAt(price: number, isBid: boolean): number;
    volumeThroughPrice(price: number, isBid: boolean): number;
}
export declare class FillEngine {
    private readonly opts;
    private nextId;
    readonly resting: Map<bigint, RestingOrder>;
    constructor(opts?: FillEngineOptions);
    newOrderId(): bigint;
    /**
     * Attempt to place. Returns fills for IOC (immediate), or rests PostOnly/Normal.
     * Rejects PostOnly that would cross.
     *
     * When `queueCtx` is provided, Normal/GTC remainder does **not** rematch against
     * the current bar (avoids double-counting bar volume). Maker fills land on the
     * next `matchRestingAgainstBar` call. Legacy path (no queueCtx) rematches as before.
     */
    place(args: PlaceArgs, book: TopOfBook, candle: Candle, queueCtx?: QueueFillContext): {
        orderId: bigint;
        fills: SimFill[];
        rejected?: string;
    };
    cancel(orderId: bigint): boolean;
    /** Match resting PostOnly/GTC against candle high/low for the bar. */
    matchRestingAgainstBar(candle: Candle, queueCtx?: QueueFillContext): SimFill[];
    private buildResting;
    private tryCross;
}
//# sourceMappingURL=fill-engine.d.ts.map