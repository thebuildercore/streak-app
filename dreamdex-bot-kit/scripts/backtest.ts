#!/usr/bin/env node
/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

/**
 * Backtest CLI for dreamdex-bot-kit strategies.
 *
 *   npm run backtest -- review --symbol WETH:USDso --interval 5m --days 7
 *   npm run backtest -- run momentum --symbol WETH:USDso --interval 1m --days 3
 *   npm run backtest -- run grid --set stepBps=20 --set lotUsdso=10
 */
import type { NetworkName } from "@dreamdex-bot-kit/core";
import {
  backtest,
  reviewBots,
  formatReviewTable,
  exportCsv,
  exportJson,
  type BotFactory,
  type CandleInterval,
  type ReviewBotSpec,
} from "@dreamdex-bot-kit/backtest";

export const BOT_IDS = [
  "momentum",
  "mean-reversion",
  "grid",
  "market-making",
  "twap",
  "starter",
  "ensemble",
  "treasury",
  "yield-optimizer",
] as const;

export type BotId = (typeof BOT_IDS)[number];

type AdapterModule = {
  createBacktestBot: (overrides?: Record<string, unknown>) => BotFactory;
};

async function loadAdapter(id: BotId): Promise<AdapterModule> {
  switch (id) {
    case "momentum":
      return import("../strategies/momentum/src/backtest.js") as Promise<AdapterModule>;
    case "mean-reversion":
      return import("../strategies/mean-reversion/src/backtest.js") as Promise<AdapterModule>;
    case "grid":
      return import("../strategies/grid/src/backtest.js") as Promise<AdapterModule>;
    case "market-making":
      return import("../strategies/market-making/src/backtest.js") as Promise<AdapterModule>;
    case "twap":
      return import("../strategies/twap/src/backtest.js") as Promise<AdapterModule>;
    case "starter":
      return import("../strategies/starter/src/backtest.js") as Promise<AdapterModule>;
    case "ensemble":
      return import("../strategies/ensemble/src/backtest.js") as Promise<AdapterModule>;
    case "treasury":
      return import("../strategies/treasury/src/backtest.js") as Promise<AdapterModule>;
    case "yield-optimizer":
      return import("../strategies/yield-optimizer/src/backtest.js") as Promise<AdapterModule>;
  }
}

interface CliFlags {
  cmd: "run" | "review";
  bot?: BotId;
  bots: BotId[];
  symbol: string;
  interval: CandleInterval;
  network: NetworkName;
  days: number;
  since?: number;
  until: number;
  spreadBps: number;
  quoteUsdso: number;
  base: number;
  takerFeeBps: number;
  makerFeeBps: number;
  slippageBps: number;
  calibrateLive: boolean;
  depthDir?: string;
  queuePosition: boolean;
  markoutBars: number;
  out?: string;
  csv?: string;
  quiet: boolean;
  noCache: boolean;
  sets: Record<string, string>;
}

function usage(): never {
  console.log(`Usage:
  npm run backtest -- review [options]
  npm run backtest -- run <bot> [options]

Bots: ${BOT_IDS.join(", ")}

Options:
  --symbol <BASE:QUOTE>   Market symbol (default WETH:USDso)
  --interval <1m|5m|...>  Candle interval (default 5m)
  --days <n>              Lookback days (default 7)
  --since <ms>            Explicit since timestamp (overrides --days)
  --until <ms>            Explicit until timestamp (default now)
  --network <mainnet|testnet>
  --bots <all|a,b,c>      review only: which bots (default all)
  --spread-bps <n>        Synthetic half-spread×2 in bps (default 10)
  --quote-usdso <n>       Starting quote balance (default 1000)
  --base <n>              Starting base balance (default 0)
  --taker-fee-bps <n>
  --maker-fee-bps <n>
  --slippage-bps <n>
  --calibrate-live        Set spread from live orderbook
  --depth-dir <path>      Overlay recorded depth snapshots
  --queue-position        Estimate queue position (candle volume + depth)
  --markout-bars <n>      Maker markout horizon in bars (default 5; 0=off)
  --set <key=value>       Override strategy config (repeatable)
  --no-cache              Skip disk candle cache
  --out <file.json>       Write JSON report
  --csv <file.csv>        Write CSV report
  --quiet                 Less strategy logging
`);
  process.exit(1);
}

function parseArgs(argv: string[]): CliFlags {
  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help") usage();

  const cmdRaw = argv[0];
  if (cmdRaw !== "run" && cmdRaw !== "review") usage();

  let bot: BotId | undefined;
  let i = 1;
  if (cmdRaw === "run") {
    const id = argv[i];
    if (!id || id.startsWith("--")) {
      console.error("run requires a bot id as first argument");
      usage();
    }
    if (!(BOT_IDS as readonly string[]).includes(id)) {
      console.error(`Unknown bot "${id}". Choose: ${BOT_IDS.join(", ")}`);
      process.exit(1);
    }
    bot = id as BotId;
    i += 1;
  }

  const flags: Record<string, string | boolean> = {};
  const sets: Record<string, string> = {};
  const boolFlags = new Set([
    "calibrate-live",
    "queue-position",
    "quiet",
    "no-cache",
  ]);

  while (i < argv.length) {
    const a = argv[i]!;
    if (!a.startsWith("--")) {
      console.error(`Unexpected argument: ${a}`);
      usage();
    }
    const key = a.slice(2);
    if (key === "set") {
      const val = argv[i + 1];
      if (!val || val.startsWith("--")) {
        console.error("--set requires key=value");
        process.exit(1);
      }
      const eq = val.indexOf("=");
      if (eq <= 0) {
        console.error(`--set expects key=value, got "${val}"`);
        process.exit(1);
      }
      sets[val.slice(0, eq)] = val.slice(eq + 1);
      i += 2;
      continue;
    }
    if (boolFlags.has(key)) {
      flags[key] = true;
      i += 1;
      continue;
    }
    const val = argv[i + 1];
    if (val === undefined || val.startsWith("--")) {
      console.error(`Flag --${key} requires a value`);
      process.exit(1);
    }
    flags[key] = val;
    i += 2;
  }

  function num(name: string, fallback: number): number {
    const v = flags[name];
    if (v === undefined) return fallback;
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error(`--${name} must be a number`);
    return n;
  }

  const until = num("until", Date.now());
  const days = num("days", 7);
  const sinceRaw = flags["since"];
  const since = sinceRaw !== undefined ? Number(sinceRaw) : until - days * 86_400_000;
  if (sinceRaw !== undefined && !Number.isFinite(since)) {
    throw new Error("--since must be a number");
  }

  const botsFlag = flags["bots"];
  let bots: BotId[] = [...BOT_IDS];
  if (typeof botsFlag === "string" && botsFlag !== "all") {
    bots = botsFlag.split(",").map((s) => s.trim()) as BotId[];
    for (const b of bots) {
      if (!(BOT_IDS as readonly string[]).includes(b)) {
        console.error(`Unknown bot "${b}". Choose: ${BOT_IDS.join(", ")}`);
        process.exit(1);
      }
    }
  }

  return {
    cmd: cmdRaw,
    bot,
    bots,
    symbol: (flags["symbol"] as string | undefined) ?? "WETH:USDso",
    interval: ((flags["interval"] as string | undefined) ?? "5m") as CandleInterval,
    network: ((flags["network"] as string | undefined) ?? "mainnet") as NetworkName,
    days,
    since,
    until,
    spreadBps: num("spread-bps", 10),
    quoteUsdso: num("quote-usdso", 1000),
    base: num("base", 0),
    takerFeeBps: num("taker-fee-bps", 0),
    makerFeeBps: num("maker-fee-bps", 0),
    slippageBps: num("slippage-bps", 0),
    calibrateLive: flags["calibrate-live"] === true,
    depthDir: flags["depth-dir"] as string | undefined,
    queuePosition: flags["queue-position"] === true,
    markoutBars: num("markout-bars", 5),
    out: flags["out"] as string | undefined,
    csv: flags["csv"] as string | undefined,
    quiet: flags["quiet"] === true,
    noCache: flags["no-cache"] === true,
    sets,
  };
}

async function main(): Promise<void> {
  const f = parseArgs(process.argv.slice(2));

  const common = {
    symbol: f.symbol,
    interval: f.interval,
    since: f.since!,
    until: f.until,
    network: f.network,
    spreadBps: f.spreadBps,
    quoteUsdso: f.quoteUsdso,
    base: f.base,
    takerFeeBps: f.takerFeeBps,
    makerFeeBps: f.makerFeeBps,
    slippageBps: f.slippageBps,
    calibrateLive: f.calibrateLive,
    depthDir: f.depthDir,
    queuePosition: f.queuePosition,
    markoutBars: f.markoutBars,
    quiet: f.quiet,
    candleCache: { disabled: f.noCache },
  };

  if (f.cmd === "review") {
    console.log(
      `Review ${f.bots.join(", ")} on ${f.symbol} ${f.interval} @ ${f.network} ` +
        `(${new Date(f.since!).toISOString()} → ${new Date(f.until).toISOString()})`,
    );
    const bots: ReviewBotSpec[] = [];
    for (const id of f.bots) {
      const mod = await loadAdapter(id);
      bots.push({
        label: id,
        createBot: mod.createBacktestBot({ ...f.sets, interval: f.interval }),
      });
    }
    const { results } = await reviewBots({ ...common, bots });
    console.log(formatReviewTable(results.map((r) => ({ botId: r.botId, metrics: r.metrics }))));
    if (f.out) await exportJson(f.out, results);
    if (f.csv) await exportCsv(f.csv, results);
    return;
  }

  const bot = f.bot!;
  console.log(`Run ${bot} on ${f.symbol} ${f.interval} @ ${f.network}`);
  const mod = await loadAdapter(bot);
  const result = await backtest({
    ...common,
    label: bot,
    createBot: mod.createBacktestBot({ ...f.sets, interval: f.interval }),
  });
  console.log(formatReviewTable([{ botId: result.botId, metrics: result.metrics }]));
  console.log(
    `candles=${result.candlesUsed} finalEquity=${result.metrics.finalEquity.toFixed(4)} ` +
      `pnl=${result.metrics.totalPnl.toFixed(4)} (${(result.metrics.totalPnlPct * 100).toFixed(2)}%)` +
      (result.metrics.avgMarkoutBps != null
        ? ` avgMarkout=${result.metrics.avgMarkoutBps.toFixed(1)}bps`
        : ""),
  );
  if (f.out) await exportJson(f.out, [result]);
  if (f.csv) await exportCsv(f.csv, [result]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
