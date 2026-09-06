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
} from "@dreamdex-bot-kit/backtest";
import type { Pool } from "@dreamdex-bot-kit/core";
import { Momentum } from "./strategy.js";
import { config, type Config } from "./config.js";

/** Build a backtest BotFactory for momentum, with optional `--set` overrides. */
export function createBacktestBot(overrides: Record<string, unknown> = {}): BotFactory {
  return async (pool, log) => {
    const cfg = applyConfigOverrides(
      { ...config, symbol: pool.symbol, dryRun: false } as Config & Record<string, unknown>,
      overrides,
    ) as Config;
    const bot = new Momentum(asPool<Pool>(pool), cfg, log);
    return {
      warmupBars: cfg.windowSize || 20,
      async onBar() {
        await bot.tick();
      },
      async finish() {
        await bot.flatten();
      },
    };
  };
}
