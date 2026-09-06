#!/usr/bin/env node
/**
 * Settlement E2E: buy into a short testnet window, wait for resolve, sweep claims.
 *
 *   node scripts/ec-test/settlement-e2e.mjs
 *   SETTLEMENT_WAIT_MS=360000 node scripts/ec-test/settlement-e2e.mjs
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadDotenv({ path: path.join(ROOT, ".env") });
const ARTIFACTS = path.join(ROOT, "artifacts");
const WAIT_MS = Number(process.env.SETTLEMENT_WAIT_MS ?? 360_000);
const BUY_MS = Number(process.env.SETTLEMENT_BUY_MS ?? 90_000);

function run(cmd, args, env, ms) {
  return new Promise((resolve) => {
    const chunks = [];
    const child = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.on("data", (d) => chunks.push(d));
    child.stderr.on("data", (d) => chunks.push(d));
    const t = setTimeout(() => child.pid && child.kill("SIGTERM"), ms);
    child.on("exit", (code) => {
      clearTimeout(t);
      resolve({ code: code ?? 1, log: Buffer.concat(chunks).toString("utf8") });
    });
  });
}

function extractTxHashes(log) {
  return [...new Set(log.match(/0x[a-fA-F0-9]{64}/g) ?? [])];
}

async function main() {
  await mkdir(ARTIFACTS, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");

  console.log(`Phase 1: buy into active window (${BUY_MS / 1000}s)…`);
  const buy = await run("npm", ["run", "start", "-w", "ec-starter"], {
    NETWORK: "testnet",
    DRY_RUN: "false",
    TAKE_INTERVAL_MS: "5000",
    TAKE_MAX_SHARES: "5",
    // Strategies claim on their own loop now. Off during the buy phase, so the
    // redemption in phase 3 is attributable to the sweep under test.
    AUTO_CLAIM: "false",
  }, BUY_MS);
  await writeFile(path.join(ARTIFACTS, `settlement-e2e-buy-${ts}.log`), buy.log, "utf8");
  console.log(`  buy exit ${buy.code}, txs: ${extractTxHashes(buy.log).length}`);

  console.log(`Phase 2: wait ${WAIT_MS / 1000}s for window to settle…`);
  await new Promise((r) => setTimeout(r, WAIT_MS));

  console.log("Phase 3: CLAIM=1 sweep…");
  const claim = await run("npm", ["run", "start", "-w", "ec-settlement"], {
    NETWORK: "testnet",
    DRY_RUN: "false",
    CLAIM: "1",
    CLAIM_SCAN: "25",
  }, 120_000);
  await writeFile(path.join(ARTIFACTS, `settlement-e2e-claim-${ts}.log`), claim.log, "utf8");

  const redeemed = /redeemed|DRY redeem/.test(claim.log);
  const scanned = /scanning \d+ recently settled/.test(claim.log);
  const buyTxs = extractTxHashes(buy.log);
  // Count trades from the log, not from tx hashes: the strategies report fills
  // in human terms ("buy 5 BTC-… @ ~0.83") and never print a hash, so keying on
  // hashes failed a run that had made 31 trades.
  const traded = (buy.log.match(/\b(buy|sell) [\d.]+ /g) ?? []).length;
  // Scanning is not the test. The chain under test is buy -> settle -> redeem,
  // so a sweep that found nothing means the chain did not close. If the buy
  // phase never filled there is no position to redeem and the run is
  // inconclusive, which is a failure to test, not a pass.
  const pass = traded > 0 && scanned && redeemed;
  const reason = traded === 0
    ? "buy phase never filled — no position to settle"
    : !scanned
      ? "claim sweep did not run"
      : !redeemed
        ? "sweep ran but redeemed nothing — the bought window may not have settled yet (raise SETTLEMENT_WAIT_MS)"
        : null;
  const result = {
    id: "g2-ec-settlement-e2e",
    gate: 2,
    pass,
    reason,
    redeemed,
    traded,
    buyTxs,
    claimTxs: extractTxHashes(claim.log),
    buyLog: `artifacts/settlement-e2e-buy-${ts}.log`,
    claimLog: `artifacts/settlement-e2e-claim-${ts}.log`,
    finishedAt: new Date().toISOString(),
  };
  await writeFile(path.join(ARTIFACTS, `settlement-e2e-${ts}.json`), JSON.stringify(result, null, 2), "utf8");
  console.log(JSON.stringify(result, null, 2));
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
