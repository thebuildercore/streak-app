/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import {
  applyConfigOverrides,
  type BotFactory,
} from "@dreamdex-bot-kit/backtest";
import { ORDER_TYPE } from "@dreamdex-bot-kit/core";
import { decide } from "./strategy.js";
import { config, type Config } from "./config.js";

/** Build a backtest BotFactory for starter, with optional `--set` overrides. */
export function createBacktestBot(overrides: Record<string, unknown> = {}): BotFactory {
  return async (pool, log) => {
    const cfg = applyConfigOverrides(
      { ...config, symbol: pool.symbol, dryRun: false } as Config & Record<string, unknown>,
      overrides,
    ) as Config;
    let openIds: bigint[] = [];

    return {
      async onBar() {
        const { bestBid, bestAsk, mid } = await pool.topOfBook();
        if (mid === undefined) return;
        const baseInventory = await pool.walletBase();
        const quotes = decide(
          { symbol: pool.symbol, bestBid, bestAsk, mid, baseInventory },
          cfg,
        );
        for (const id of openIds) {
          try {
            await pool.cancel(id);
          } catch {
            /* ignore */
          }
        }
        openIds = [];
        for (const q of quotes) {
          try {
            const res = await pool.place({
              isBid: q.side === "buy",
              price: q.price,
              qty: q.size,
              orderType: q.postOnly === false ? ORDER_TYPE.ImmediateOrCancel : ORDER_TYPE.PostOnly,
              expireMs: cfg.expireMs || 3_600_000,
            });
            if (res.orderId) openIds.push(res.orderId);
            log(`starter ${q.side} ${q.size.toFixed(6)} @ ${q.price.toFixed(6)}`);
          } catch (e) {
            log(`starter place failed`, (e as Error).message);
          }
        }
      },
      async finish() {
        for (const id of openIds) {
          try {
            await pool.cancel(id);
          } catch {
            /* ignore */
          }
        }
        openIds = [];
      },
    };
  };
}
