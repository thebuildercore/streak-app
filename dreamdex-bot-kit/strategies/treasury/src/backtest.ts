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
import type { ChainContext, Pool } from "@dreamdex-bot-kit/core";
import { TreasuryBot } from "./strategy.js";
import { config, type Config } from "./config.js";

/** Minimal ChainContext stub — quote balance comes from SimPool via quoteReader. */
function stubCtx(): ChainContext {
  return {
    net: { name: "testnet" },
    account: { address: "0x0000000000000000000000000000000000000001" },
    publicClient: {},
    walletClient: {},
  } as unknown as ChainContext;
}

/** Build a backtest BotFactory for treasury quoting (refill disabled offline). */
export function createBacktestBot(overrides: Record<string, unknown> = {}): BotFactory {
  return async (pool, log) => {
    const cfg = applyConfigOverrides(
      {
        ...config,
        symbol: pool.symbol,
        dryRun: false,
        swapEnabled: false,
        // Sim quote defaults to 1000; live minIdle=1000 would yield deployable=0.
        minIdleUsdso: 0,
        requoteCooldownMs: 0,
        requoteTriggerBps: 0,
      } as Config & Record<string, unknown>,
      overrides,
    ) as Config;

    const sim = pool as SimPool;
    const bot = new TreasuryBot(
      stubCtx(),
      asPool<Pool>(pool),
      cfg,
      log,
      () => sim.walletQuote(),
    );

    return {
      async onBar() {
        await bot.onBook();
      },
      async finish() {
        await bot.cancelAll();
      },
    };
  };
}
