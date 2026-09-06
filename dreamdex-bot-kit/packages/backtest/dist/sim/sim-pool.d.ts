/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { PlaceOrderResult, TopOfBook } from "@dreamdex-bot-kit/core";
import type { Candle } from "../candles/types.js";
import { type HybridBookOptions } from "../book/hybrid.js";
import type { SyntheticDepthOptions } from "../book/synthetic.js";
import { FillEngine, type FillEngineOptions } from "./fill-engine.js";
import { PortfolioLedger } from "./ledger.js";
import type { PlaceArgs, PoolLike } from "./pool-like.js";
export interface MarketMeta {
    tick: number;
    lot: number;
    minQty: number;
}
export interface QueuePositionOptions {
    enabled: boolean;
    depth?: SyntheticDepthOptions;
}
export interface SimPoolOptions {
    symbol: string;
    meta: MarketMeta;
    ledger: PortfolioLedger;
    bookOpts?: HybridBookOptions;
    fillOpts?: FillEngineOptions;
    queuePosition?: QueuePositionOptions;
}
/**
 * Simulated Pool for backtests. Strategies call the same surface as live Pool.
 */
export declare class SimPool implements PoolLike {
    readonly symbol: string;
    readonly tick: number;
    readonly lot: number;
    readonly minQty: number;
    private book;
    private candle;
    readonly engine: FillEngine;
    readonly ledger: PortfolioLedger;
    private readonly bookOpts;
    private readonly queueOpts;
    private queueCtx;
    constructor(opts: SimPoolOptions);
    /** Advance simulation to this candle's book (and match resting orders). */
    setCandle(candle: Candle): void;
    currentBook(): TopOfBook;
    topOfBook(_depth?: number): Promise<TopOfBook>;
    place(args: PlaceArgs): Promise<PlaceOrderResult>;
    cancel(orderId: bigint): Promise<`0x${string}`>;
    walletBase(): Promise<number>;
    walletQuote(): Promise<number>;
}
//# sourceMappingURL=sim-pool.d.ts.map