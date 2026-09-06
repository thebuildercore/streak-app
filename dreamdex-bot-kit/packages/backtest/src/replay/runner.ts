/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import type { NetworkName } from "@dreamdex-bot-kit/core";
import type { Candle, CandleInterval } from "../candles/types.js";
import { INTERVAL_MS, parseCandleNums } from "../candles/types.js";
import { fetchCandlesRange, fetchMarkets, fetchTickers } from "../candles/fetch.js";
import { readCandleCache, writeCandleCache, type CandleCacheOptions } from "../candles/cache.js";
import { calibrateLiveSpread, loadDepthSnapshots } from "../book/depth-overlay.js";
import type { HybridBookOptions } from "../book/hybrid.js";
import type { SyntheticDepthOptions } from "../book/synthetic.js";
import { PortfolioLedger } from "../sim/ledger.js";
import { SimPool } from "../sim/sim-pool.js";
import type { SimFill } from "../sim/fill-engine.js";
import type { BotFactory } from "../types.js";
import { installReplayClock } from "./clock.js";
import { computeMetrics, type BacktestMetrics } from "../report/metrics.js";
import { computeMarkouts } from "../report/markout.js";

export interface BacktestOptions {
  /** Label used in logs and reports (e.g. strategy id). */
  label: string;
  /** Factory that builds the strategy handle for this run. */
  createBot: BotFactory;
  symbol: string;
  interval: CandleInterval;
  since: number;
  until?: number;
  network?: NetworkName;
  spreadBps?: number;
  midMode?: "close" | "hl2";
  quoteUsdso?: number;
  base?: number;
  takerFeeBps?: number;
  makerFeeBps?: number;
  slippageBps?: number;
  calibrateLive?: boolean;
  depthDir?: string;
  /** Pre-fetched candles (skips network + cache). */
  candles?: Candle[];
  quiet?: boolean;
  /** Include equity curve, fills, and candles in the result (for UI). Default false. */
  includeDetails?: boolean;
  /**
   * Opt-in estimated queue-position modeling (changes fill qty/timing).
   * Uses candle volume + causal recorded depth when available.
   */
  queuePosition?: boolean;
  /** Knobs for synthetic depth curve when queuePosition is enabled. */
  queueDepthOptions?: SyntheticDepthOptions;
  /**
   * Forward markout horizon in bars for maker fills. Default 5.
   * Set to 0 to disable. Purely additive reporting — does not affect fills/PnL.
   */
  markoutBars?: number;
  /** Disk candle cache options. Pass `{ disabled: true }` to force a fresh fetch. */
  candleCache?: CandleCacheOptions;
}

export interface EquityPoint {
  t: number;
  equity: number;
}

export interface BacktestRunResult {
  botId: string;
  metrics: BacktestMetrics;
  warnings: string[];
  candlesUsed: number;
  equityCurve?: EquityPoint[];
  fills?: SimFill[];
  candles?: Candle[];
}

export interface ReviewBotsResult {
  results: BacktestRunResult[];
  /** Shared candle series when includeDetails is true (avoid N× duplication). */
  candles?: Candle[];
}

export interface ReviewBotSpec {
  label: string;
  createBot: BotFactory;
}

async function loadCandles(
  opts: BacktestOptions,
  network: NetworkName,
  until: number,
): Promise<Candle[]> {
  if (opts.candles) return opts.candles;

  const cacheOpts = opts.candleCache;
  const cached = readCandleCache(opts.symbol, opts.interval, opts.since, until, network, cacheOpts);
  if (cached) return cached;

  const candles = await fetchCandlesRange(opts.symbol, opts.interval, opts.since, until, {
    network,
  });
  writeCandleCache(opts.symbol, opts.interval, opts.since, until, network, candles, cacheOpts);
  return candles;
}

export async function backtest(opts: BacktestOptions): Promise<BacktestRunResult> {
  const network = opts.network ?? "mainnet";
  const until = opts.until ?? Date.now();
  const warnings: string[] = [];
  const log = opts.quiet
    ? () => undefined
    : (msg: string, extra?: unknown) => {
        if (extra !== undefined) console.log(`[${opts.label}] ${msg}`, extra);
        else console.log(`[${opts.label}] ${msg}`);
      };

  const candles = await loadCandles(opts, network, until);

  if (candles.length === 0) {
    warnings.push("No candles in window — check symbol/network/interval.");
  } else {
    const nonzero = candles.filter((c) => Number(c.close) > 0 && Number(c.volume) > 0);
    if (nonzero.length === 0) {
      warnings.push("All candles have zero close/volume (no trades in window).");
    }
  }

  try {
    const tickers = await fetchTickers([opts.symbol], { network });
    const t = tickers.find((x) => x.symbol === opts.symbol);
    if (t && (t.lastTradeAt === null || t.lastTradeAt === undefined)) {
      warnings.push(`Ticker lastTradeAt is null for ${opts.symbol} — market may never have traded.`);
    }
  } catch {
    /* optional preflight */
  }

  let spreadBps = opts.spreadBps ?? 10;
  if (opts.calibrateLive) {
    const cal = await calibrateLiveSpread(opts.symbol, network);
    if (cal) {
      spreadBps = cal.spreadBps;
      log(`calibrated live spread ${spreadBps.toFixed(2)} bps`);
    } else {
      warnings.push("calibrate-live failed; using --spread-bps / default.");
    }
  }

  const bookOpts: HybridBookOptions = {
    spreadBps,
    midMode: opts.midMode ?? "close",
    calibratedSpreadBps: opts.calibrateLive ? spreadBps : undefined,
  };
  if (opts.depthDir) {
    bookOpts.snapshots = await loadDepthSnapshots(opts.depthDir);
    log(`loaded ${bookOpts.snapshots.size} depth snapshots from ${opts.depthDir}`);
  }

  let meta = { tick: 0.000001, lot: 0.000001, minQty: 0.000001 };
  try {
    const markets = await fetchMarkets({ network });
    const m = markets.find((x) => x.symbol === opts.symbol);
    if (m) {
      meta = {
        tick: Number(m.tickSize),
        lot: Number(m.lotSize),
        minQty: Number(m.minQuantity),
      };
    } else {
      warnings.push(`Market ${opts.symbol} not in /markets — using fallback tick/lot.`);
    }
  } catch (e) {
    warnings.push(`Could not fetch markets: ${(e as Error).message}`);
  }

  if (opts.queuePosition) {
    log("queue-position modeling enabled (candle volume + optional recorded depth)");
  }

  const initialQuote = opts.quoteUsdso ?? 1000;
  const initialBase = opts.base ?? 0;
  const ledger = new PortfolioLedger(initialQuote, initialBase);
  const pool = new SimPool({
    symbol: opts.symbol,
    meta,
    ledger,
    bookOpts,
    fillOpts: {
      takerFeeBps: opts.takerFeeBps ?? 0,
      makerFeeBps: opts.makerFeeBps ?? 0,
      slippageBps: opts.slippageBps ?? 0,
    },
    queuePosition: opts.queuePosition
      ? { enabled: true, depth: opts.queueDepthOptions }
      : undefined,
  });

  const bot = await opts.createBot(pool, log);
  if (bot.warmupBars && candles.length < bot.warmupBars) {
    warnings.push(
      `Only ${candles.length} candles; bot wants ~${bot.warmupBars} warmup bars — results may be empty.`,
    );
  }

  const equityCurve: Array<{ t: number; equity: number }> = [];
  const startMs = candles[0]?.timestamp ?? opts.since;
  const clock = installReplayClock(startMs);

  try {
    for (const candle of candles) {
      clock.setTime(candle.timestamp);
      pool.setCandle(candle);
      try {
        await bot.onBar();
      } catch (e) {
        log(`onBar error`, (e as Error).message);
      }
      const mid = pool.currentBook().mid ?? parseCandleNums(candle).close;
      if (mid > 0) equityCurve.push({ t: candle.timestamp, equity: ledger.equity(mid) });
    }
    if (bot.finish) {
      try {
        await bot.finish();
      } catch (e) {
        log(`finish error`, (e as Error).message);
      }
    }
  } finally {
    clock.uninstall();
  }

  const markoutBars = opts.markoutBars ?? 5;
  if (markoutBars > 0) {
    computeMarkouts(ledger.fills, candles, {
      bars: markoutBars,
      intervalMs: INTERVAL_MS[opts.interval],
      bookOpts,
    });
  }

  const firstClose = candles[0] ? parseCandleNums(candles[0]).close : 0;
  const lastMid =
    pool.currentBook().mid ??
    (candles.length ? parseCandleNums(candles[candles.length - 1]!).close : 0);
  const initialEquity = initialQuote + initialBase * firstClose;
  const metrics = computeMetrics({
    initialEquity,
    finalEquity: ledger.equity(lastMid || 0),
    ledger,
    equityCurve,
    lastMid,
  });
  if (bot.metricsExtras) {
    Object.assign(metrics, bot.metricsExtras());
  }

  for (const w of warnings) {
    if (!opts.quiet) console.warn(`[warn] ${w}`);
  }

  const result: BacktestRunResult = {
    botId: opts.label,
    metrics,
    warnings,
    candlesUsed: candles.length,
  };

  if (opts.includeDetails) {
    result.equityCurve = equityCurve;
    result.fills = [...ledger.fills];
    result.candles = candles;
  }

  return result;
}

/** Run several bots on the same candle series (fair comparison). */
export async function reviewBots(
  opts: Omit<BacktestOptions, "label" | "createBot"> & { bots: ReviewBotSpec[] },
): Promise<ReviewBotsResult> {
  const network = opts.network ?? "mainnet";
  const until = opts.until ?? Date.now();
  const candles =
    opts.candles ??
    (await loadCandles(
      {
        ...opts,
        label: "review",
        createBot: async () => ({ onBar: async () => undefined }),
      },
      network,
      until,
    ));

  const results: BacktestRunResult[] = [];
  for (const bot of opts.bots) {
    const r = await backtest({
      ...opts,
      label: bot.label,
      createBot: bot.createBot,
      candles,
      quiet: opts.quiet,
      includeDetails: opts.includeDetails,
    });
    if (opts.includeDetails) {
      delete r.candles;
    }
    results.push(r);
  }

  return {
    results,
    candles: opts.includeDetails ? candles : undefined,
  };
}
