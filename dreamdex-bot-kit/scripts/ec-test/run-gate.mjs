#!/usr/bin/env node
/**
 * Run one or all EC test cases: spawn bot(s), capture logs, evaluate assertions.
 *
 *   npm run ec:test -- --gate=1
 *   npm run ec:test -- --gate=2 --id=g2-ec-maker
 *   EC_TEST_DURATION_MS=60000 npm run ec:test -- --gate=1 --bot=ec-maker
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { CASES, CROSS, durationMs } from "./matrix.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadDotenv({ path: path.join(ROOT, ".env") });
const ARTIFACTS = path.join(ROOT, "artifacts");

function parseArgs(argv) {
  const out = { gate: null, bot: null, id: null };
  for (const a of argv) {
    if (a.startsWith("--gate=")) out.gate = Number(a.slice(7));
    else if (a.startsWith("--bot=")) out.bot = a.slice(6);
    else if (a.startsWith("--id=")) out.id = a.slice(5);
  }
  return out;
}

function evaluateAssertion(log, assertion, exitCode) {
  if (assertion.exitCode !== undefined) {
    const ok = exitCode === assertion.exitCode;
    return { ok: assertion.invert ? !ok : ok, label: assertion.label };
  }
  const re = assertion.pattern;
  const count = (log.match(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g")) || []).length;
  const found = count > 0;
  const min = assertion.minCount ?? 1;
  let ok = found ? count >= min : false;
  if (assertion.invert) ok = !found;
  return { ok, label: assertion.label, count };
}

function evaluateCase(log, testCase, exitCode) {
  const results = { must: [], should: [], pass: true };
  // Applied centrally, not per case: an unhandled rejection is a failure for any
  // bot under any gate, and a new case should not be able to forget it.
  for (const a of [CROSS.noUnhandled, ...(testCase.must ?? [])]) {
    const r = evaluateAssertion(log, a, exitCode);
    results.must.push(r);
    if (!r.ok) results.pass = false;
  }
  for (const a of testCase.should ?? []) {
    results.should.push(evaluateAssertion(log, a, exitCode));
  }
  if (testCase.id === "g1-fail-oracle-mainnet-feed" || testCase.id === "g3-oracle-no-feed") {
    if (exitCode !== 0 && /No price feed configured/.test(log)) results.pass = true;
  }
  return results;
}

function buildChildEnv(testCase, wallet) {
  const env = { ...process.env, ...testCase.env };
  if (wallet === "taker") {
    const taker = (process.env.TAKER_PRIVATE_KEY ?? "").trim();
    // No silent fallback. Without a second key the counterparty would run on the
    // SAME wallet as the bot under test: the two race each other's nonce, and
    // the liquidity the case depends on cannot exist because the pool refuses a
    // self-match. Caught in a real run as "nonce too low".
    env.PRIVATE_KEY = taker.startsWith("0x") ? taker : `0x${taker}`;
    delete env.TAKER_PRIVATE_KEY;
  }
  if (testCase.env.PRIVATE_KEY === "") {
    env.PRIVATE_KEY = "";
    delete env.TAKER_PRIVATE_KEY;
  }
  return env;
}

function extractTxHashes(log) {
  return [...new Set(log.match(/0x[a-fA-F0-9]{64}/g) ?? [])];
}

async function postCheck(caseEnv = {}) {
  return new Promise((resolve) => {
    const child = spawn("npx", ["tsx", "scripts/ec-test/post-check.ts"], {
      cwd: ROOT,
      // The probe must look at the network the case traded on. Inheriting only
      // the shell env made the gate-3 leak check read TESTNET open orders while
      // the bot traded mainnet — a check pointed at the wrong chain.
      env: { ...process.env, ...caseEnv },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ openOrders: null, reason: "post-check timeout" });
    }, 45_000);
    child.on("exit", () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(out.trim().split("\n").pop() ?? "{}"));
      } catch {
        resolve({ parseError: out.slice(0, 200) });
      }
    });
  });
}

function runBot(bot, env, duration) {
  return new Promise((resolve) => {
    const chunks = [];
    const child = spawn("npm", ["run", "start", "-w", bot], {
      cwd: ROOT,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });
    child.stdout.on("data", (d) => chunks.push(d));
    child.stderr.on("data", (d) => chunks.push(d));

    let stopped = false;
    const stop = () => {
      if (stopped || !child.pid) return;
      stopped = true;
      child.kill("SIGTERM");
      // Graceful shutdown now does real work — read open orders, cancel each one —
      // so 8s was killing bots mid-cleanup and recording it as exit 1. Give the
      // cleanup room, then the exit code means something.
      setTimeout(() => {
        if (child.exitCode === null && child.pid) child.kill("SIGKILL");
      }, 30_000);
    };

    const timer = setTimeout(stop, duration);

    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      resolve({
        exitCode: code ?? (signal ? 1 : 0),
        signal,
        log: Buffer.concat(chunks).toString("utf8"),
      });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ exitCode: 1, signal: null, log: String(err) });
    });
  });
}

async function runCase(testCase) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const skipJson = async (reason) => {
    const jsonPath = path.join(ARTIFACTS, `${testCase.id}-${ts}-skipped.json`);
    await writeFile(
      jsonPath,
      JSON.stringify(
        {
          id: testCase.id,
          gate: testCase.gate,
          bot: testCase.bot,
          pass: null,
          skipped: reason,
          finishedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
    return { skipped: true, reason };
  };

  if (testCase.gate === 2 && testCase.env.DRY_RUN === "false") {
    const pk = (process.env.PRIVATE_KEY ?? "").trim();
    if (!pk) return skipJson("PRIVATE_KEY not set in environment/.env");
    // A counterparty case needs a SECOND key. Falling back to the primary one
    // puts two senders on one wallet: they race each other's nonce, and the
    // liquidity the case exists to provide cannot appear because the pool
    // refuses a self-match. Skip it loudly instead of reporting a green run.
    if (testCase.counterparty?.some((c) => c.wallet === "taker") && !(process.env.TAKER_PRIVATE_KEY ?? "").trim()) {
      return skipJson("counterparty case needs TAKER_PRIVATE_KEY — a SECOND funded key, not the primary one");
    }
  }
  if (testCase.gate === 3 && testCase.env.NETWORK === "mainnet" && testCase.env.DRY_RUN === "false") {
    const pk = (process.env.PRIVATE_KEY ?? "").trim();
    if (!pk) return skipJson("PRIVATE_KEY required for mainnet smoke");
    if (process.env.EC_ALLOW_MAINNET !== "1") return skipJson("Set EC_ALLOW_MAINNET=1 to run gate 3 live mainnet");
  }

  const base = `${testCase.id}-${ts}`;
  const logPath = path.join(ARTIFACTS, `${base}.log`);
  const jsonPath = path.join(ARTIFACTS, `${base}.json`);
  const duration = durationMs(testCase);
  const counterChildren = [];

  for (const cp of testCase.counterparty ?? []) {
    counterChildren.push(
      runBot(cp.bot, buildChildEnv({ ...testCase, env: { ...testCase.env, DRY_RUN: "false" } }, cp.wallet), duration),
    );
  }
  if (counterChildren.length) await new Promise((r) => setTimeout(r, 8000));

  // Gate 3 is wet too, and on mainnet a stranded order is real money.
  const wet = (testCase.gate === 2 || testCase.gate === 3) && testCase.env.DRY_RUN === "false";
  // Only the scope, not the case's trading knobs: the probe just reads orders.
  const probeEnv = {};
  for (const k of ["NETWORK", "VENUE_ID", "OPERATOR_ID"]) {
    if (testCase.env[k] !== undefined) probeEnv[k] = testCase.env[k];
  }
  const preCheck = wet ? await postCheck(probeEnv) : null;

  const main = await runBot(testCase.bot, buildChildEnv(testCase, "primary"), duration);
  const cpResults = await Promise.all(counterChildren);

  let log = main.log;
  if (cpResults.length) log += "\n\n--- counterparty ---\n" + cpResults.map((c) => c.log).join("\n---\n");

  await writeFile(logPath, log, "utf8");
  // The leak check is the whole point of a wet run, so give it a second chance
  // under RPC load rather than letting a timeout stand in for a clean book.
  let postCheckResult = wet ? await postCheck(probeEnv) : null;
  if (wet && postCheckResult?.openOrders == null) postCheckResult = await postCheck(probeEnv);
  const txHashes = extractTxHashes(log);
  const evalResult = evaluateCase(log, testCase, main.exitCode);

  if (wet) {
    const before = preCheck?.openOrders;
    const after = postCheckResult?.openOrders;
    if (after == null) {
      // Unknown is not clean. A check that could not run is a failed check —
      // otherwise a flaky RPC quietly certifies a bot that strands orders.
      evalResult.pass = false;
      evalResult.must.push({
        ok: false,
        label: `open-order check could not run (${postCheckResult?.reason ?? "no result"})`,
        count: 0,
      });
    } else {
      // Measure the DELTA, not the absolute count. The probe is wallet-wide, so
      // an unrelated order resting from an earlier session would otherwise fail
      // every case forever. What this run must not do is leave MORE behind.
      const baseline = before ?? 0;
      const leaked = after - baseline;
      const ok = leaked <= 0;
      if (!ok) evalResult.pass = false;
      evalResult.must.push({
        ok,
        label: `left no new open orders (before ${baseline}, after ${after})`,
        count: Math.max(0, leaked),
      });
    }
  }

  const payload = {
    id: testCase.id,
    gate: testCase.gate,
    bot: testCase.bot,
    durationMs: duration,
    exitCode: main.exitCode,
    pass: evalResult.pass,
    must: evalResult.must,
    should: evalResult.should,
    logPath: path.relative(ROOT, logPath),
    note: testCase.note ?? null,
    txHashes,
    preCheck,
    postCheck: postCheckResult,
    finishedAt: new Date().toISOString(),
  };
  await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.gate == null) {
    console.error("Usage: npm run ec:test -- --gate=0|1|2|3 [--bot=ec-maker] [--id=g2-ec-maker]");
    process.exit(1);
  }

  await mkdir(ARTIFACTS, { recursive: true });

  let cases = CASES.filter((c) => c.gate === args.gate);
  if (args.id) cases = cases.filter((c) => c.id === args.id);
  else if (args.bot) cases = cases.filter((c) => c.bot === args.bot);

  if (cases.length === 0) {
    console.error(`No cases for gate=${args.gate}`);
    process.exit(1);
  }

  console.log(`Running ${cases.length} case(s) for gate ${args.gate}…\n`);
  const summary = [];
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    if (i > 0 && c.gate === 2) await new Promise((r) => setTimeout(r, 15_000));
    process.stdout.write(`${c.id} … `);
    const result = await runCase(c);
    if (result.skipped) {
      console.log(`SKIP (${result.reason})`);
      summary.push({ id: c.id, pass: null });
      continue;
    }
    console.log(result.pass ? "PASS" : "FAIL (see artifacts)");
    summary.push({ id: c.id, pass: result.pass });
  }

  const failed = summary.filter((s) => s.pass === false);
  const skipped = summary.filter((s) => s.pass === null);
  console.log(`\nDone: ${summary.filter((s) => s.pass === true).length} passed, ${failed.length} failed, ${skipped.length} skipped`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
