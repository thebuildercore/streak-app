/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import type { PlaceOrderResult, TopOfBook } from "@dreamdex-bot-kit/core";
import type { Candle } from "../candles/types.js";
import { hybridTopOfBook, type HybridBookOptions } from "../book/hybrid.js";
import type { SyntheticDepthOptions } from "../book/synthetic.js";
import { FillEngine, type FillEngineOptions, type QueueFillContext } from "./fill-engine.js";
import { buildQueueContext } from "./queue-model.js";
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
export class SimPool implements PoolLike {
  readonly symbol: string;
  readonly tick: number;
  readonly lot: number;
  readonly minQty: number;

  private book: TopOfBook = {};
  private candle: Candle | null = null;
  readonly engine: FillEngine;
  readonly ledger: PortfolioLedger;
  private readonly bookOpts: HybridBookOptions;
  private readonly queueOpts: QueuePositionOptions | undefined;
  private queueCtx: QueueFillContext | undefined;

  constructor(opts: SimPoolOptions) {
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
  setCandle(candle: Candle): void {
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
    for (const f of fills) this.ledger.applyFill(f);
  }

  currentBook(): TopOfBook {
    return this.book;
  }

  async topOfBook(_depth = 1): Promise<TopOfBook> {
    return { ...this.book };
  }

  async place(args: PlaceArgs): Promise<PlaceOrderResult> {
    if (!this.candle) throw new Error("SimPool: no candle set");
    // Align loosely to lot/min (strategies already size carefully)
    if (args.qty < this.minQty) {
      throw new Error(`qty ${args.qty} below minQty ${this.minQty}`);
    }
    const result = this.engine.place(args, this.book, this.candle, this.queueCtx);
    if (result.rejected) {
      throw new Error(result.rejected);
    }
    for (const f of result.fills) this.ledger.applyFill(f);
    const txHash = (`0x${result.orderId.toString(16).padStart(64, "0")}`) as `0x${string}`;
    return { txHash, orderId: result.orderId, gasUsed: 0n };
  }

  async cancel(orderId: bigint): Promise<`0x${string}`> {
    this.engine.cancel(orderId);
    return (`0x${orderId.toString(16).padStart(64, "0")}`) as `0x${string}`;
  }

  async walletBase(): Promise<number> {
    return this.ledger.base;
  }

  async walletQuote(): Promise<number> {
    return this.ledger.quote;
  }
}
