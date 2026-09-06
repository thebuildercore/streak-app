/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// Runnable entry: connect, quote inside the DreamDEX Gaussian yield band until Ctrl-C.
// WS-driven requotes with a poll-interval fallback; kill switch on stale feed / gas / toxicity.

import {
  createChainContext,
  Pool,
  DreamDexWs,
  describeYieldBand,
  fromRaw,
} from "@dreamdex-bot-kit/core";
import { config, resolveSigmaRaw } from "./config.js";
import { YieldOptimizer } from "./strategy.js";

function log(msg: string, extra?: unknown): void {
  const line = `[yo ${new Date().toISOString()}] ${msg}`;
  if (extra !== undefined) console.log(line, extra);
  else console.log(line);
}

async function main(): Promise<void> {
  const ctx = createChainContext();
  log(`network=${ctx.net.name} wallet=${ctx.account.address} dryRun=${config.dryRun}`);

  const pool = await Pool.load(ctx, config.symbol);
  const sigmaRaw = resolveSigmaRaw(pool.params.tickSize);
  const band = describeYieldBand(sigmaRaw, config.minWeight);
  const radiusHuman = fromRaw(band.radiusRaw, pool.quoteDecimals);
  log(
    `market ${config.symbol} tick=${pool.tick} lot=${pool.lot} minQty=${pool.minQty} ` +
      `σ_raw=${sigmaRaw} band_radius≈${radiusHuman} (human price units)`,
  );

  let wsRef: DreamDexWs | undefined;
  const bot = new YieldOptimizer(ctx, pool, config, log, {
    sigmaRaw,
    lastWsAt: () => wsRef?.lastMessageAt ?? 0,
    networkName: ctx.net.name,
  });

  const ws = new DreamDexWs(
    ctx.net,
    (msg) => {
      if (msg.channel === "orderbook") {
        bot.onBook().catch((e) => log("onBook error", (e as Error).message));
      }
    },
    () => log("ws connected — subscriptions (re)sent"),
  );
  wsRef = ws;

  ws.connect();
  ws.subscribeOrderbook([config.symbol]);

  const interval = setInterval(() => {
    bot.onBook().catch((e) => log("tick error", (e as Error).message));
  }, config.refreshIntervalMs);

  await bot.onBook();

  const shutdown = async () => {
    log("shutting down — cancelling open quotes…");
    clearInterval(interval);
    ws.close();
    await bot.cancelAll();
    const x = bot.extras();
    log(`final scoreAccrued=${x.estYieldScore.toFixed(4)} gasTxs=${x.gasTxs}`);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[yo] fatal:", err);
  process.exit(1);
});
