/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// Modular ensemble bot.
// Classical analyzers (momentum, mean-reversion, grid) advise each cycle; an
// optional OpenAI-compatible LLM fuses them into BUY/SELL/HOLD. When FEATURES_AI
// is false, a majority vote fuses signals instead. Execution goes through
// @dreamdex-bot-kit/core Pool.place (IOC). Keep DRY_RUN=true until you're happy
// with the logs.

import { Orchestrator } from "./orchestrator.js";

async function main(): Promise<void> {
  const orch = new Orchestrator();
  await orch.start();

  const shutdown = async () => {
    console.log(`[ensemble ${new Date().toISOString()}] shutting down…`);
    await orch.stop();
    process.exit(0);
  };
  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

main().catch((e) => {
  console.error(`[ensemble] fatal: ${(e as Error).message}`);
  process.exit(1);
});
