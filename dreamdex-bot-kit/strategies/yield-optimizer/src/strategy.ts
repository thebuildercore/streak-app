/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// Yield-band market maker: Avellaneda-lite reservation price + Gaussian proximity
// snap into DreamDEX's collateral-yield weight region.
//
// Protocol σ (YO_SIGMA_*) is the yield-band width in raw price units.
// Avellaneda σ_vol is realized mid stdev over YO_VOL_LOOKBACK — a different σ.

import {
  Pool,
  ORDER_TYPE,
  shiftBps,
  spreadBps,
  toRaw,
  fromRaw,
  proximityWeight,
  scoreIncrement,
  snapPriceToMinWeight,
  describeYieldBand,
  type ChainContext,
} from "@dreamdex-bot-kit/core";
import { readMode, resolveSigmaRaw, type Config } from "./config.js";
import { appendMid, appendTrade, appendYield } from "./csv-log.js";

interface RestingOrder {
  orderId: bigint;
  price: number;
  qty: number;
  placedAt: number;
  lastScoreAt: number;
}

export interface YieldOptimizerExtras {
  estYieldScore: number;
  scoreRate: number;
  gasTxs: number;
  killed: boolean;
  killReason?: string;
}

export interface YieldOptimizerOpts {
  /** Override σ resolution (backtests pass an explicit raw value). */
  sigmaRaw?: bigint;
  /** Quote-token decimals (default: live Pool.quoteDecimals, else 18). */
  quoteDecimals?: number;
  /** Tick size in raw units (default: live Pool.params.tickSize). */
  tickRaw?: bigint;
  lastWsAt?: () => number;
  networkName?: string;
  /**
   * `wall` (default): accrue score from Date.now Δt inside onBook (live).
   * `bar`: skip wall accrual; backtest calls accrueBar(dt, mid) once per candle.
   */
  scoreMode?: "wall" | "bar";
}

export class YieldOptimizer {
  private bid?: RestingOrder;
  private ask?: RestingOrder;
  private lastMid?: number;
  private lastRequoteAt = 0;
  private requoting = false;
  private flattened = false;
  private killed = false;
  private killReason?: string;
  private placeFailures = 0;
  private gasTxs = 0;
  private scoreAccrued = 0;
  private lastScoreWall = Date.now();
  private readonly midWindow: number[] = [];
  private readonly recentMarkouts: number[] = [];
  private sigmaRaw: bigint;
  private quoteDecimals: number;
  private tickRaw: bigint;
  private lastWsAtProvider?: () => number;
  private networkName = "unknown";
  private scoreMode: "wall" | "bar" = "wall";

  constructor(
    private readonly ctx: ChainContext,
    private readonly pool: Pool,
    private readonly cfg: Config,
    private readonly log: (msg: string, extra?: unknown) => void,
    opts?: YieldOptimizerOpts,
  ) {
    this.quoteDecimals = opts?.quoteDecimals ?? (pool as Pool).quoteDecimals ?? 18;
    this.tickRaw =
      opts?.tickRaw ??
      (pool as Pool).params?.tickSize ??
      toRaw(pool.tick, this.quoteDecimals);
    this.sigmaRaw = opts?.sigmaRaw ?? resolveSigmaRaw(this.tickRaw);
    this.lastWsAtProvider = opts?.lastWsAt;
    this.networkName = opts?.networkName ?? ctx.net.name;
    this.scoreMode = opts?.scoreMode ?? "wall";
    const band = describeYieldBand(this.sigmaRaw, this.cfg.minWeight);
    this.log(
      `yield-band σ_raw=${this.sigmaRaw} radius_raw=${band.radiusRaw} ` +
        `minW=${this.cfg.minWeight.toFixed(3)} W(1σ)=${band.weights.atOneSigma.toFixed(4)} ` +
        `W(2σ)=${band.weights.atTwoSigma.toFixed(4)}`,
    );
  }

  /** Backtest / reporting hook. */
  extras(): YieldOptimizerExtras {
    return {
      estYieldScore: this.scoreAccrued,
      scoreRate: this.currentScoreRate(),
      gasTxs: this.gasTxs,
      killed: this.killed,
      killReason: this.killReason,
    };
  }

  setLastWsAt(fn: () => number): void {
    this.lastWsAtProvider = fn;
  }

  /** Called on every book update (WS) and on the poll interval. */
  async onBook(): Promise<void> {
    if (this.requoting) return;
    this.requoting = true;
    try {
      if (this.scoreMode === "wall") this.accrueScore();

      const mode = readMode();
      if (mode === "cancel" || mode === "flatten" || this.killed) {
        if (!this.flattened) {
          this.log(
            this.killed
              ? `killed (${this.killReason}) — cancelling open quotes`
              : `mode=${mode} — cancelling open quotes`,
          );
          await this.cancelAll();
          this.flattened = true;
        }
        return;
      }
      this.flattened = false;

      if (await this.checkKillSwitches()) return;

      await this.reconcileOpenOrders();

      if (Date.now() - this.lastRequoteAt < this.cfg.requoteCooldownMs) return;
      await this.requote();
      await this.maybeLogMetrics();
    } finally {
      this.requoting = false;
    }
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

  private async checkKillSwitches(): Promise<boolean> {
    const lastWs = this.lastWsAtProvider?.() ?? 0;
    if (lastWs > 0 && Date.now() - lastWs > this.cfg.staleMs) {
      await this.tripKill(`ws stale > ${this.cfg.staleMs}ms`);
      return true;
    }

    try {
      const gasWei = await this.ctx.publicClient.getBalance({
        address: this.ctx.account.address,
      });
      const gasSomi = fromRaw(gasWei, 18);
      if (gasSomi < this.cfg.minGasSomi) {
        await this.tripKill(`gas ${gasSomi.toFixed(4)} SOMI < floor ${this.cfg.minGasSomi}`);
        return true;
      }
    } catch {
      /* sim / stub may lack getBalance */
    }

    const mid = this.lastMid;
    if (mid !== undefined && mid > 0) {
      const base = await this.pool.walletBase();
      const invUsdso = base * mid;
      if (invUsdso > this.cfg.maxInventoryUsdso) {
        await this.tripKill(
          `inventory $${invUsdso.toFixed(2)} > max $${this.cfg.maxInventoryUsdso}`,
        );
        return true;
      }
    }

    if (this.placeFailures >= 5) {
      await this.tripKill(`place failures=${this.placeFailures}`);
      return true;
    }

    if (this.cfg.maxToxicBps > 0 && this.recentMarkouts.length >= 5) {
      const avg =
        this.recentMarkouts.reduce((a, b) => a + b, 0) / this.recentMarkouts.length;
      if (avg < -this.cfg.maxToxicBps) {
        await this.tripKill(
          `rolling markout ${avg.toFixed(1)}bps < -${this.cfg.maxToxicBps}`,
        );
        return true;
      }
    }

    return false;
  }

  private async tripKill(reason: string): Promise<void> {
    if (this.killed) return;
    this.killed = true;
    this.killReason = reason;
    this.log(`KILL SWITCH — ${reason}`);
    await this.cancelAll();
    this.flattened = true;
  }

  private async requote(): Promise<void> {
    const { bestBid, bestAsk, mid } = await this.pool.topOfBook();
    if (mid === undefined || bestBid === undefined || bestAsk === undefined) {
      this.log("no two-sided mid — cancelling (zero yield accrual without mid)");
      await this.cancelAll();
      return;
    }

    this.pushMid(mid);
    if (this.cfg.midsCsv) {
      await appendMid(this.cfg.midsCsv, new Date().toISOString(), mid);
    }

    const bookBps = spreadBps(bestBid, bestAsk);
    if (bookBps > this.cfg.maxBookSpreadBps) {
      this.log(`book spread ${bookBps.toFixed(1)}bps > max ${this.cfg.maxBookSpreadBps}bps — skipping`);
      return;
    }

    const baseInv = await this.pool.walletBase();
    const invUsdso = baseInv * mid;

    // Flatten valve before normal quoting (from yield_maker.py).
    if (this.cfg.flattenAboveUsdso > 0 && invUsdso > this.cfg.flattenAboveUsdso) {
      await this.flattenExcess(mid, bestBid, baseInv, invUsdso);
      return;
    }

    const sigmaVol = this.realizedVol();
    const denom = Math.max(this.cfg.notionalUsdso, 1e-9);
    const qNorm =
      (invUsdso - this.cfg.targetInventoryUsdso) /
      Math.max(this.cfg.targetInventoryUsdso, denom);
    const reservationShift = qNorm * this.cfg.gamma * sigmaVol * sigmaVol * mid;
    const reservation = mid - reservationShift;

    const minHalf = mid * (this.cfg.halfSpreadBps / 10_000);
    const volHalf = this.cfg.kVol * sigmaVol * mid;
    const half = Math.max(minHalf, volHalf);

    let bidPrice = reservation - half;
    let askPrice = reservation + half;

    // Snap into the Gaussian yield band (protocol σ).
    const midRaw = toRaw(mid, this.quoteDecimals);
    const bestAskRaw = toRaw(bestAsk, this.quoteDecimals);
    const bestBidRaw = toRaw(bestBid, this.quoteDecimals);

    const bidSnapped = snapPriceToMinWeight({
      candidateRaw: toRaw(bidPrice, this.quoteDecimals),
      midRaw,
      sigmaRaw: this.sigmaRaw,
      minWeight: this.cfg.minWeight,
      tickRaw: this.tickRaw,
      isBid: true,
      oppositeRaw: bestAskRaw,
    });
    const askSnapped = snapPriceToMinWeight({
      candidateRaw: toRaw(askPrice, this.quoteDecimals),
      midRaw,
      sigmaRaw: this.sigmaRaw,
      minWeight: this.cfg.minWeight,
      tickRaw: this.tickRaw,
      isBid: false,
      oppositeRaw: bestBidRaw,
    });

    bidPrice = fromRaw(bidSnapped, this.quoteDecimals);
    askPrice = fromRaw(askSnapped, this.quoteDecimals);

    const bidW = proximityWeight(bidSnapped, midRaw, this.sigmaRaw);
    const askW = proximityWeight(askSnapped, midRaw, this.sigmaRaw);

    // Refuse to quote a side that still fails the weight floor after snap
    // (would-cross into the opposite side before reaching minW).
    const bidOk = bidW >= this.cfg.minWeight * 0.99 && bidPrice < bestAsk;
    const askOk = askW >= this.cfg.minWeight * 0.99 && askPrice > bestBid;

    // Inventory-scaled size.
    const invFrac = Math.min(1, Math.max(0, invUsdso / Math.max(this.cfg.maxInventoryUsdso, 1e-9)));
    const sizeScale = 1 - 0.8 * invFrac;
    let bidQty = (this.cfg.notionalUsdso * sizeScale) / mid;
    let askQty = Math.min(baseInv, (this.cfg.notionalUsdso * sizeScale) / mid);

    if (bidQty < this.pool.minQty) bidQty = 0;
    if (askQty < this.pool.minQty) askQty = 0;

    // Requote gate: mid drift, or resting W fell out of band.
    const haveLive = !!(this.bid || this.ask);
    if (this.lastMid !== undefined && haveLive) {
      const driftBps = Math.abs((mid - this.lastMid) / this.lastMid) * 10_000;
      const bidOut =
        this.bid !== undefined &&
        proximityWeight(toRaw(this.bid.price, this.quoteDecimals), midRaw, this.sigmaRaw) <
          this.cfg.minWeight;
      const askOut =
        this.ask !== undefined &&
        proximityWeight(toRaw(this.ask.price, this.quoteDecimals), midRaw, this.sigmaRaw) <
          this.cfg.minWeight;
      if (driftBps < this.cfg.requoteTriggerBps && !bidOut && !askOut) return;
    }
    this.lastMid = mid;
    this.lastRequoteAt = Date.now();

    this.log(
      `requote mid=${mid.toFixed(6)} r=${reservation.toFixed(6)} ` +
        `bid=${bidPrice.toFixed(6)}×${bidQty.toFixed(6)}(W=${bidW.toFixed(3)}) ` +
        `ask=${askPrice.toFixed(6)}×${askQty.toFixed(6)}(W=${askW.toFixed(3)}) ` +
        `σ_vol=${sigmaVol.toFixed(6)} qNorm=${qNorm.toFixed(3)}`,
    );

    if (bidOk && bidQty >= this.pool.minQty) {
      await this.replaceLeg("bid", bidPrice, bidQty);
    } else if (this.bid) {
      await this.cancelLeg("bid");
      this.log(`bid skipped (ok=${bidOk} qty=${bidQty.toFixed(6)} W=${bidW.toFixed(3)})`);
    }

    if (askOk && askQty >= this.pool.minQty) {
      await this.replaceLeg("ask", askPrice, askQty);
    } else if (this.ask) {
      await this.cancelLeg("ask");
      this.log(`ask skipped (ok=${askOk} qty=${askQty.toFixed(6)} W=${askW.toFixed(3)})`);
    }
  }

  private async flattenExcess(
    mid: number,
    bestBid: number,
    baseInv: number,
    invUsdso: number,
  ): Promise<void> {
    this.log(
      `flatten valve: inventory $${invUsdso.toFixed(2)} > ${this.cfg.flattenAboveUsdso} — shedding`,
    );
    if (this.bid) await this.cancelLeg("bid");

    const excessUsd = invUsdso - this.cfg.targetInventoryUsdso;
    let qty = Math.min(baseInv, excessUsd / bestBid);
    if (qty < this.pool.minQty) return;

    const price = shiftBps(bestBid, -this.cfg.flattenCrossBps);
    this.lastRequoteAt = Date.now();
    this.lastMid = mid;

    if (this.cfg.dryRun) {
      this.log(`[dry-run] flatten sell ${qty.toFixed(6)} @ ${price.toFixed(6)}`);
      return;
    }

    try {
      const res = await this.pool.place({
        isBid: false,
        price,
        qty,
        orderType: ORDER_TYPE.ImmediateOrCancel,
        expireMs: this.cfg.expireMs,
      });
      this.gasTxs += 1;
      this.log(`flatten IOC sell ${qty.toFixed(6)} @ ${price.toFixed(6)} tx=${res.txHash}`);
      if (this.cfg.tradesCsv) {
        await appendTrade(this.cfg.tradesCsv, {
          ts: new Date().toISOString(),
          network: this.networkName,
          pool: this.pool.symbol,
          side: "sell",
          action: "fill",
          orderId: res.orderId?.toString(),
          price,
          qty,
          notional: price * qty,
          txHash: res.txHash,
          note: "flatten",
        });
      }
      // Approximate markout sample: flatten is aggressive — treat as 0 for toxicity filter.
      this.pushMarkout(0);
    } catch (err) {
      this.log(`flatten failed`, (err as Error).message);
      this.placeFailures += 1;
    }
  }

  private async cancelLeg(side: "bid" | "ask"): Promise<void> {
    const existing = side === "bid" ? this.bid : this.ask;
    if (!existing) return;
    if (!this.cfg.dryRun && existing.orderId !== 0n) {
      try {
        await this.pool.cancel(existing.orderId);
        this.gasTxs += 1;
        if (this.cfg.tradesCsv) {
          await appendTrade(this.cfg.tradesCsv, {
            ts: new Date().toISOString(),
            network: this.networkName,
            pool: this.pool.symbol,
            side,
            action: "cancel",
            orderId: existing.orderId.toString(),
            price: existing.price,
            qty: existing.qty,
            notional: existing.price * existing.qty,
          });
        }
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
      const now = Date.now();
      const rec: RestingOrder = {
        orderId: 0n,
        price,
        qty,
        placedAt: now,
        lastScoreAt: now,
      };
      if (side === "bid") this.bid = rec;
      else this.ask = rec;
      return;
    }

    if (existing) {
      try {
        await this.pool.cancel(existing.orderId);
        this.gasTxs += 1;
        if (this.cfg.tradesCsv) {
          await appendTrade(this.cfg.tradesCsv, {
            ts: new Date().toISOString(),
            network: this.networkName,
            pool: this.pool.symbol,
            side,
            action: "cancel",
            orderId: existing.orderId.toString(),
            price: existing.price,
            qty: existing.qty,
            notional: existing.price * existing.qty,
          });
        }
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
      this.gasTxs += 1;
      this.placeFailures = 0;
      const now = Date.now();
      const rec: RestingOrder = {
        orderId: res.orderId ?? 0n,
        price,
        qty,
        placedAt: now,
        lastScoreAt: now,
      };
      if (side === "bid") this.bid = rec;
      else this.ask = rec;
      this.log(`posted ${side} ${qty.toFixed(6)} @ ${price.toFixed(6)} id=${res.orderId} tx=${res.txHash}`);
      if (this.cfg.tradesCsv) {
        await appendTrade(this.cfg.tradesCsv, {
          ts: new Date().toISOString(),
          network: this.networkName,
          pool: this.pool.symbol,
          side,
          action: "post",
          orderId: res.orderId?.toString(),
          price,
          qty,
          notional: price * qty,
          txHash: res.txHash,
        });
      }
    } catch (err) {
      this.log(`post ${side} failed`, (err as Error).message);
      this.placeFailures += 1;
      if (side === "bid") this.bid = undefined;
      else this.ask = undefined;
    }
  }

  async cancelAll(): Promise<void> {
    for (const side of ["bid", "ask"] as const) {
      await this.cancelLeg(side);
    }
  }

  private accrueScore(): void {
    const now = Date.now();
    const dtSec = (now - this.lastScoreWall) / 1000;
    this.lastScoreWall = now;
    if (!(dtSec > 0) || this.lastMid === undefined) return;

    const midRaw = toRaw(this.lastMid, this.quoteDecimals);
    for (const o of [this.bid, this.ask]) {
      if (!o) continue;
      const W = proximityWeight(toRaw(o.price, this.quoteDecimals), midRaw, this.sigmaRaw);
      this.scoreAccrued += scoreIncrement(o.qty, W, dtSec);
      o.lastScoreAt = now;
    }
  }

  private currentScoreRate(): number {
    if (this.lastMid === undefined) return 0;
    const midRaw = toRaw(this.lastMid, this.quoteDecimals);
    let rate = 0;
    for (const o of [this.bid, this.ask]) {
      if (!o) continue;
      const W = proximityWeight(toRaw(o.price, this.quoteDecimals), midRaw, this.sigmaRaw);
      rate += o.qty * W;
    }
    return rate;
  }

  private async maybeLogMetrics(): Promise<void> {
    const rate = this.currentScoreRate();
    const bidW =
      this.bid && this.lastMid !== undefined
        ? proximityWeight(
            toRaw(this.bid.price, this.quoteDecimals),
            toRaw(this.lastMid, this.quoteDecimals),
            this.sigmaRaw,
          )
        : 0;
    const askW =
      this.ask && this.lastMid !== undefined
        ? proximityWeight(
            toRaw(this.ask.price, this.quoteDecimals),
            toRaw(this.lastMid, this.quoteDecimals),
            this.sigmaRaw,
          )
        : 0;

    // Without peer maker scores we cannot convert accrued score → USDso payout.
    // YO_POOL_USDSO / YO_SETTLE_SEC are reserved for a future settlement ingest.
    const estYieldUsdso: number | null = null;

    this.log(
      `net-score scoreRate=${rate.toFixed(6)} accrued=${this.scoreAccrued.toFixed(4)} ` +
        `bidW=${bidW.toFixed(3)} askW=${askW.toFixed(3)} gasTxs=${this.gasTxs} ` +
        `(spread/AS via edge-analytics on CSV; yield payout needs settlement ingest)`,
    );

    if (this.cfg.yieldCsv) {
      await appendYield(this.cfg.yieldCsv, {
        ts: new Date().toISOString(),
        scoreRate: rate,
        scoreAccrued: this.scoreAccrued,
        bidW,
        askW,
        estYieldUsdso,
        gasTxs: this.gasTxs,
      });
    }
  }

  private pushMid(mid: number): void {
    this.midWindow.push(mid);
    while (this.midWindow.length > this.cfg.volLookback) this.midWindow.shift();
  }

  /** Relative stdev of mid returns over the lookback window. */
  private realizedVol(): number {
    if (this.midWindow.length < 3) return 0;
    const rets: number[] = [];
    for (let i = 1; i < this.midWindow.length; i++) {
      const a = this.midWindow[i - 1]!;
      const b = this.midWindow[i]!;
      if (a > 0) rets.push((b - a) / a);
    }
    if (rets.length < 2) return 0;
    const mean = rets.reduce((s, x) => s + x, 0) / rets.length;
    const v = rets.reduce((s, x) => s + (x - mean) ** 2, 0) / (rets.length - 1);
    return Math.sqrt(Math.max(0, v));
  }

  private pushMarkout(bps: number): void {
    this.recentMarkouts.push(bps);
    while (this.recentMarkouts.length > 20) this.recentMarkouts.shift();
  }

  /** Backtest: accrue one bar of score using current resting quotes + mid. */
  accrueBar(dtSec: number, mid: number): void {
    if (!(dtSec > 0) || !(mid > 0)) return;
    const midRaw = toRaw(mid, this.quoteDecimals);
    for (const o of [this.bid, this.ask]) {
      if (!o) continue;
      const W = proximityWeight(toRaw(o.price, this.quoteDecimals), midRaw, this.sigmaRaw);
      this.scoreAccrued += scoreIncrement(o.qty, W, dtSec);
    }
    this.lastMid = mid;
    this.pushMid(mid);
  }
}

function approxEq(a: number, b: number): boolean {
  return Math.abs(a - b) / (b || 1) < 1e-9;
}
