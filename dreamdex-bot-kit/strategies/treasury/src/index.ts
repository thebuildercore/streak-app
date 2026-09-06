/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// Runnable entry: connect, optionally refill USDso from idle USDC.e, then quote
// until Ctrl-C. WS-driven requotes with a poll-interval fallback; refill only
// runs on start + poll ticks (cooldown-gated), never on every book update.

import { createChainContext, Pool, DreamDexWs } from "@dreamdex-bot-kit/core";
import { config } from "./config.js";
import { TreasuryBot } from "./strategy.js";
import { createRefillState, maybeRefillUsDso } from "./refill.js";

function log(msg: string, extra?: unknown): void {
  const line = `[treasury ${new Date().toISOString()}] ${msg}`;
  if (extra !== undefined) console.log(line, extra);
  else console.log(line);
}

async function main(): Promise<void> {
  const ctx = createChainContext();
  log(
    `network=${ctx.net.name} wallet=${ctx.account.address} dryRun=${config.dryRun} ` +
      `deployRatio=${config.deployRatio} minIdle=${config.minIdleUsdso} swap=${config.swapEnabled}`,
  );

  const pool = await Pool.load(ctx, config.symbol);
  log(`market ${config.symbol} tick=${pool.tick} lot=${pool.lot} minQty=${pool.minQty}`);

  const bot = new TreasuryBot(ctx, pool, config, log);
  const refillState = createRefillState();

  const runRefill = () =>
    maybeRefillUsDso({
      ctx,
      quotePool: pool,
      cfg: config,
      state: refillState,
      log,
      quoteIdle: () => bot.readQuoteIdle(),
    }).catch((e) => log("refill error", (e as Error).message));

  // WS-driven requoting, with a poll-interval fallback for quiet books.
  const ws = new DreamDexWs(
    ctx.net,
    (msg) => {
      if (msg.channel === "orderbook") bot.onBook().catch((e) => log("onBook error", (e as Error).message));
    },
    () => log("ws connected — subscriptions (re)sent"),
  );
  ws.connect();
  ws.subscribeOrderbook([config.symbol]);

  const interval = setInterval(() => {
    runRefill().then(() => bot.onBook().catch((e) => log("tick error", (e as Error).message)));
  }, config.tickMs);

  await runRefill();
  await bot.onBook();

  const shutdown = async () => {
    log("shutting down — cancelling open quotes…");
    clearInterval(interval);
    ws.close();
    await bot.cancelAll();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[treasury] fatal:", err);
  process.exit(1);
});
