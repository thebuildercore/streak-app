/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import {
  applyConfigOverrides,
  asPool,
  INTERVAL_MS,
  type BotFactory,
  type CandleInterval,
} from "@dreamdex-bot-kit/backtest";
import { toRaw, type ChainContext, type Pool } from "@dreamdex-bot-kit/core";
import { YieldOptimizer } from "./strategy.js";
import { config, type Config } from "./config.js";

/** Minimal ChainContext stub for SimPool backtests. */
function stubCtx(): ChainContext {
  return {
    net: { name: "testnet" },
    account: { address: "0x0000000000000000000000000000000000000001" },
    publicClient: {
      getBalance: async () => 10n ** 18n, // 1 SOMI — above gas floor
    },
    walletClient: {},
  } as unknown as ChainContext;
}

/**
 * Build a backtest BotFactory for the yield optimizer.
 * Accrues an own-order relative score each bar (not a predicted USDso payout).
 */
export function createBacktestBot(overrides: Record<string, unknown> = {}): BotFactory {
  return async (pool, log) => {
    const cfg = applyConfigOverrides(
      {
        ...config,
        symbol: pool.symbol,
        dryRun: false,
        requoteCooldownMs: 0,
        requoteTriggerBps: 0,
        staleMs: 1e12, // no WS in backtest
        flattenAboveUsdso: 0,
        tradesCsv: undefined,
        midsCsv: undefined,
        yieldCsv: undefined,
      } as Config & Record<string, unknown>,
      overrides,
    ) as Config;

    const quoteDecimals = 18;
    const tickRaw = toRaw(pool.tick, quoteDecimals);
    const sigmaTicks =
      typeof overrides.sigmaTicks === "number"
        ? Math.max(1, Math.floor(overrides.sigmaTicks as number))
        : Number(process.env.YO_SIGMA_TICKS ?? 50);
    const sigmaRaw =
      typeof overrides.sigmaRaw === "bigint"
        ? (overrides.sigmaRaw as bigint)
        : typeof overrides.sigmaRaw === "string" || typeof overrides.sigmaRaw === "number"
          ? BigInt(overrides.sigmaRaw as string | number)
          : tickRaw * BigInt(sigmaTicks);

    const bot = new YieldOptimizer(stubCtx(), asPool<Pool>(pool), cfg, log, {
      sigmaRaw,
      quoteDecimals,
      tickRaw,
      networkName: "backtest",
      lastWsAt: () => Date.now(),
      scoreMode: "bar",
    });

    // Prefer CLI `--interval` (passed via createBacktestBot({ interval })) over default 5m.
    const interval = (overrides.interval as CandleInterval | undefined) ?? "5m";
    const barSec = (INTERVAL_MS[interval] ?? 300_000) / 1000;

    return {
      async onBar() {
        await bot.onBook();
        const { mid } = await pool.topOfBook();
        if (mid !== undefined) bot.accrueBar(barSec, mid);
      },
      async finish() {
        await bot.cancelAll();
        const x = bot.extras();
        log(`estYieldScore=${x.estYieldScore.toFixed(4)} (own-order relative; not USDso payout)`);
      },
      metricsExtras() {
        return { estYieldScore: bot.extras().estYieldScore };
      },
    };
  };
}
