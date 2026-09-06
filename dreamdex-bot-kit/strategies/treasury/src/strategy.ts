/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// Treasury idle-yield maker: park deployable USDso as two-sided PostOnly quotes.
//
// Capital rule: treat wallet quote (USDso) as idle. Keep MIN_IDLE unquoted, deploy
// DEPLOY_RATIO of the remainder (optionally capped). Requote only when mid drifts
// past a trigger — same gas-efficient pattern as market-making.
//
// Yield comes from resting maker / proximity rewards on DreamDEX, not from a vault
// deposit. Optional USDC.e→USDso refill lives in refill.ts.

import {
  Pool,
  ORDER_TYPE,
  shiftBps,
  spreadBps,
  ERC20_ABI,
  fromRaw,
  type ChainContext,
} from "@dreamdex-bot-kit/core";
import { readMode, type Config } from "./config.js";

interface RestingOrder {
  orderId: bigint;
  price: number;
  qty: number;
}

/** Quote-token wallet balance (USDso on every kit market). */
export async function walletQuote(ctx: ChainContext, pool: Pool): Promise<number> {
  const subject = ctx.owner ?? ctx.account.address;
  const raw = await ctx.publicClient.readContract({
    address: pool.params.quoteToken,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [subject],
  });
  return fromRaw(raw, pool.quoteDecimals);
}

export class TreasuryBot {
  private bid?: RestingOrder;
  private ask?: RestingOrder;
  private lastMid?: number;
  private lastRequoteAt = 0;
  private requoting = false;
  private flattened = false;

  constructor(
    private readonly ctx: ChainContext,
    private readonly pool: Pool,
    private readonly cfg: Config,
    private readonly log: (msg: string, extra?: unknown) => void,
    /** Override quote-balance reads (SimPool backtest). Defaults to ERC-20 balanceOf. */
    private readonly quoteReader?: () => Promise<number>,
  ) {}

  private async readWalletQuote(): Promise<number> {
    if (this.quoteReader) return this.quoteReader();
    return walletQuote(this.ctx, this.pool);
  }

  /**
   * Idle USDso for capital rules: wallet balance plus notional locked in our
   * resting bid (auto-pull removes that from the wallet while the order lives).
   */
  async readQuoteIdle(): Promise<number> {
    const wallet = await this.readWalletQuote();
    const reserved = this.bid ? this.bid.price * this.bid.qty : 0;
    return wallet + reserved;
  }

  /** Drop local legs whose order ids are no longer open (filled / canceled). */
  private async reconcileOpenOrders(): Promise<void> {
    if (this.cfg.dryRun) return;
    if (typeof this.pool.openOrderIds !== "function") return;
    const tracked = [this.bid, this.ask].filter(
      (o): o is RestingOrder => !!o && o.orderId !== 0n,
    );
    if (tracked.length === 0) return;
    let open: Set<bigint>;
    try {
      open = new Set(await this.pool.openOrderIds());
    } catch {
      return;
    }
    if (this.bid && this.bid.orderId !== 0n && !open.has(this.bid.orderId)) {
      this.log(`bid id=${this.bid.orderId} gone — clearing local leg`);
      this.bid = undefined;
    }
    if (this.ask && this.ask.orderId !== 0n && !open.has(this.ask.orderId)) {
      this.log(`ask id=${this.ask.orderId} gone — clearing local leg`);
      this.ask = undefined;
    }
  }

  /** Called on every book update (WS) and on the poll interval. */
  async onBook(): Promise<void> {
    if (this.requoting) return;

    const mode = readMode();
    if (mode === "cancel" || mode === "flatten") {
      if (!this.flattened) {
        this.log(`mode=${mode} — cancelling open quotes`);
        await this.cancelAll();
        this.flattened = true;
      }
      return;
    }
    this.flattened = false;

    if (Date.now() - this.lastRequoteAt < this.cfg.requoteCooldownMs) return;
    this.requoting = true;
    try {
      await this.reconcileOpenOrders();
      await this.requote();
    } finally {
      this.requoting = false;
    }
  }

  private async requote(): Promise<void> {
    const { bestBid, bestAsk, mid } = await this.pool.topOfBook();
    if (mid === undefined) {
      this.log("no mid price (empty book) — skipping requote");
      return;
    }

    if (bestBid !== undefined && bestAsk !== undefined) {
      const bookBps = spreadBps(bestBid, bestAsk);
      if (bookBps > this.cfg.maxBookSpreadBps) {
        this.log(`book spread ${bookBps.toFixed(1)}bps > max ${this.cfg.maxBookSpreadBps}bps — skipping`);
        return;
      }
    }

    const idle = await this.readQuoteIdle();
    let deployable = Math.max(0, idle - this.cfg.minIdleUsdso) * this.cfg.deployRatio;
    if (this.cfg.maxNotionalUsdso !== undefined) {
      deployable = Math.min(deployable, this.cfg.maxNotionalUsdso);
    }

    const baseInv = await this.pool.walletBase();
    const bidQty = deployable / mid;
    const askQty = Math.min(baseInv, deployable / mid);

    if (deployable <= 0 || bidQty < this.pool.minQty) {
      if (this.bid || this.ask) {
        this.log(
          `idle=${idle.toFixed(2)} deployable=${deployable.toFixed(2)} ` +
            `(buffer=${this.cfg.minIdleUsdso} ratio=${this.cfg.deployRatio}) — below quote size, clearing`,
        );
        await this.cancelAll();
      } else if (this.lastMid === undefined) {
        this.log(
          `idle=${idle.toFixed(2)} deployable=${deployable.toFixed(2)} ` +
            `(buffer=${this.cfg.minIdleUsdso} ratio=${this.cfg.deployRatio}) — below quote size, waiting`,
        );
      }
      this.lastMid = mid;
      this.lastRequoteAt = Date.now();
      return;
    }

    // Only requote once the mid has drifted enough (and only if we already have quotes up).
    const haveLive = this.bid && (this.ask || askQty < this.pool.minQty);
    if (this.lastMid !== undefined && haveLive) {
      const driftBps = Math.abs((mid - this.lastMid) / this.lastMid) * 10_000;
      if (driftBps < this.cfg.requoteTriggerBps) return;
    }
    this.lastMid = mid;
    this.lastRequoteAt = Date.now();

    // Light inventory skew vs half of deployable (secondary to idle sizing).
    const invUsdso = baseInv * mid;
    const target = deployable / 2;
    const denom = deployable || 1;
    const imbalance = (invUsdso - target) / denom;
    const skewBps = imbalance * this.cfg.inventorySkewBps;
    const halfBps = this.cfg.spreadBps / 2;

    const bidPrice = shiftBps(mid, -halfBps - skewBps);
    const askPrice = shiftBps(mid, +halfBps - skewBps);

    this.log(
      `requote mid=${mid.toFixed(6)} idle=${idle.toFixed(2)} deployable=${deployable.toFixed(2)} ` +
        `bid=${bidPrice.toFixed(6)}×${bidQty.toFixed(6)} ask=${askPrice.toFixed(6)}×${askQty.toFixed(6)} ` +
        `skewBps=${skewBps.toFixed(2)}`,
    );

    await this.replaceLeg("bid", bidPrice, bidQty);
    if (askQty >= this.pool.minQty) {
      await this.replaceLeg("ask", askPrice, askQty);
    } else {
      // No base to sell — cancel any resting ask so we don't leave stale size.
      if (this.ask) {
        await this.cancelLeg("ask");
      }
      this.log(`ask qty ${askQty.toFixed(6)} < min ${this.pool.minQty} — bid-only`);
    }
  }

  private async cancelLeg(side: "bid" | "ask"): Promise<void> {
    const existing = side === "bid" ? this.bid : this.ask;
    if (!existing) return;
    if (!this.cfg.dryRun && existing.orderId !== 0n) {
      try {
        await this.pool.cancel(existing.orderId);
      } catch (err) {
        this.log(`cancel ${side} failed`, (err as Error).message);
      }
    }
    if (side === "bid") this.bid = undefined;
    else this.ask = undefined;
  }

  private async replaceLeg(side: "bid" | "ask", price: number, qty: number): Promise<void> {
    const existing = side === "bid" ? this.bid : this.ask;
    if (existing && approxEq(existing.price, price) && approxEq(existing.qty, qty)) return;

    if (this.cfg.dryRun) {
      this.log(`[dry-run] ${side} ${qty.toFixed(6)} @ ${price.toFixed(6)}`);
      if (side === "bid") this.bid = { orderId: 0n, price, qty };
      else this.ask = { orderId: 0n, price, qty };
      return;
    }

    if (existing) {
      try {
        await this.pool.cancel(existing.orderId);
      } catch (err) {
        this.log(`cancel ${side} failed`, (err as Error).message);
      }
    }

    try {
      const res = await this.pool.place({
        isBid: side === "bid",
        price,
        qty,
        orderType: ORDER_TYPE.PostOnly,
        expireMs: this.cfg.expireMs,
      });
      const rec = { orderId: res.orderId ?? 0n, price, qty };
      if (side === "bid") this.bid = rec;
      else this.ask = rec;
      this.log(`posted ${side} ${qty.toFixed(6)} @ ${price.toFixed(6)} id=${res.orderId} tx=${res.txHash}`);
    } catch (err) {
      this.log(`post ${side} failed`, (err as Error).message);
      if (side === "bid") this.bid = undefined;
      else this.ask = undefined;
    }
  }

  /** Cancel all resting quotes — call on shutdown or flatten. */
  async cancelAll(): Promise<void> {
    for (const o of [this.bid, this.ask]) {
      if (o && o.orderId !== 0n) {
        try {
          await this.pool.cancel(o.orderId);
        } catch { /* best-effort */ }
      }
    }
    this.bid = undefined;
    this.ask = undefined;
  }
}

function approxEq(a: number, b: number): boolean {
  return Math.abs(a - b) / (b || 1) < 1e-9;
}
