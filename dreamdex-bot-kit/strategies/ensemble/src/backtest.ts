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
  type BotFactory,
  type SimPool,
} from "@dreamdex-bot-kit/backtest";
import type { Pool } from "@dreamdex-bot-kit/core";
import { Orchestrator } from "./orchestrator.js";
import { config } from "./config.js";

/**
 * Build a backtest BotFactory for ensemble.
 * Forces AI fusion off for deterministic, offline runs.
 */
export function createBacktestBot(overrides: Record<string, unknown> = {}): BotFactory {
  return async (pool, log) => {
    const flatOverrides = { ...overrides };
    // Allow `--set features.ai=true` style keys if ever needed; default force off.
    delete flatOverrides["features.ai"];

    const applied = applyConfigOverrides(
      {
        ...config,
        symbol: pool.symbol,
        dryRun: false,
      } as typeof config & Record<string, unknown>,
      flatOverrides,
    ) as typeof config;

    Object.assign(config, applied);
    config.symbol = pool.symbol;
    config.dryRun = false;
    config.features = { ...config.features, ai: false };

    const orch = new Orchestrator();
    let started = false;

    return {
      warmupBars: Math.max(config.windowSize, config.rsiPeriod + 1, config.bbPeriod) || 40,
      async onBar() {
        if (!started) {
          await orch.startBacktest(asPool<Pool>(pool), {
            log,
            quoteReader: () => (pool as SimPool).walletQuote(),
          });
          started = true;
        }
        await orch.cycle();
      },
      async finish() {
        await orch.stop();
      },
    };
  };
}
