#!/usr/bin/env node
/**
 * Repo consistency checks.
 *
 *   npm run check
 *   CHECKS_VERBOSE=1 npm run check
 *
 * These are the rules that hold this kit together and that nothing else
 * enforces. Typecheck proves the code compiles and `npm test` proves the pure
 * functions behave; neither notices a strategy that cannot deploy, a knob no
 * one can set, or a documented address that has drifted from the code.
 *
 * Nothing here touches the network, so it runs in a second and belongs in CI.
 * Exit 1 if any check fails.
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const read = (rel) => readFile(path.join(ROOT, rel), "utf8");
const dirsIn = async (rel) =>
  (await readdir(path.join(ROOT, rel), { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

/** Every .ts under a directory, tests excluded. */
async function sourcesIn(rel) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(path.join(ROOT, rel), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const child = path.join(rel, e.name);
    if (e.isDirectory()) out.push(...(await sourcesIn(child)));
    else if (e.name.endsWith(".ts") && !e.name.endsWith(".test.ts")) out.push(child);
  }
  return out;
}

const ok = (id, detail = "ok", log = "") => ({ id, pass: true, detail, log });
const bad = (id, detail, log = "") => ({ id, pass: false, detail, log });

/**
 * A strategy that is not in the Railway allow-list cannot be deployed from the
 * one-click template, and the failure shows up on someone else's machine.
 */
async function railwayAllowed() {
  const railway = await read("scripts/railway-start.mjs");
  const strategies = await dirsIn("strategies");
  const missing = strategies.filter((name) => !railway.includes(`"${name}"`));
  return missing.length
    ? bad("railway-allowed", `not deployable: ${missing.join(", ")}`, `strategies/: ${strategies.join(", ")}`)
    : ok("railway-allowed", `${strategies.length} strategies`);
}

/**
 * `npm run <x>` in a comment or a README is a promise. It is kept if the root
 * or any workspace defines that script — `npm run dev` is fine when the
 * strategies define `dev`, and dead when nothing does.
 */
async function npmScriptsExist() {
  const defined = new Set();
  const pkgDirs = ["", ...(await dirsIn("strategies")).map((d) => `strategies/${d}`), ...(await dirsIn("packages")).map((d) => `packages/${d}`)];
  for (const d of pkgDirs) {
    try {
      const pkg = JSON.parse(await read(path.join(d, "package.json")));
      for (const k of Object.keys(pkg.scripts ?? {})) defined.add(k);
    } catch {
      /* no package.json here */
    }
  }
  const files = [
    ...(await sourcesIn("packages")),
    ...(await sourcesIn("strategies")),
    ...(await sourcesIn("scripts")),
    "README.md",
    "docs/event-contracts.md",
  ];
  const missing = new Map();
  for (const f of files) {
    let text = "";
    try {
      text = await read(f);
    } catch {
      continue;
    }
    for (const m of text.matchAll(/npm run ([a-zA-Z][a-zA-Z0-9:_-]*)/g)) {
      if (!defined.has(m[1])) missing.set(m[1], f);
    }
  }
  return missing.size
    ? bad(
        "npm-scripts",
        [...missing.keys()].join(", "),
        [...missing].map(([s, f]) => `npm run ${s} → referenced in ${f}, defined nowhere`).join("\n"),
      )
    : ok("npm-scripts", `${defined.size} defined`);
}

/**
 * A knob the code reads but `.env.example` never mentions is a knob nobody can
 * find, including whatever generates configs for people.
 *
 * Scoped to the ec-* strategies. The spot strategies read roughly seventy knobs
 * that `.env.example` does not carry either; that predates this check and
 * widening the rule to cover them belongs in its own change, not here.
 */
async function envDocumented() {
  const example = await read(".env.example");
  const keys = new Set();
  for (const dir of (await dirsIn("strategies")).filter((d) => d.startsWith("ec-"))) {
    for (const f of await sourcesIn(`strategies/${dir}/src`)) {
      const src = await read(f);
      for (const m of src.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) keys.add(m[1]);
      for (const m of src.matchAll(/process\.env\[["']([A-Z][A-Z0-9_]*)["']\]/g)) keys.add(m[1]);
      // The spot strategies read through local helpers — num("MM_NOTIONAL_USDSO", 20),
      // str(...), bool(...) — and ec-core through envNum(). Matching only
      // `process.env.X` made this check blind to every spot knob in the repo.
      for (const m of src.matchAll(/\b[a-zA-Z][a-zA-Z0-9_]*\(\s*["']([A-Z][A-Z0-9_]{2,})["']\s*,/g)) keys.add(m[1]);
    }
  }
  // process.on("SIGTERM") and friends look like env reads to the matcher above.
  const NOT_ENV = new Set(["SIGINT", "SIGTERM"]);
  const missing = [...keys].filter((k) => !NOT_ENV.has(k) && !example.includes(k)).sort();
  return missing.length
    ? bad("env-documented", `undocumented: ${missing.join(", ")}`, `read by strategies: ${[...keys].sort().join(", ")}`)
    : ok("env-documented", `${keys.size} ec knobs`);
}

/** The lifecycle the bots gate on. Off-by-one here trades a locked market. */
async function marketStatusEnum() {
  const text = await read("packages/ec-core/src/markets.ts");
  const expected = { Listed: 0, Trading: 1, Locked: 2, Settling: 3, Resolved: 4, Voided: 5 };
  const wrong = Object.entries(expected).filter(([name, n]) => !new RegExp(`${name}:\\s*${n}\\b`).test(text));
  return wrong.length
    ? bad("market-status", wrong.map(([n, v]) => `${n} != ${v}`).join(", "))
    : ok("market-status");
}

/**
 * Sharp edge 4: a bot that crosses the touch must send IOC. With `limit` the
 * unfilled remainder rests with escrow locked, invisibly.
 */
async function noTakerLimit() {
  const offenders = [];
  for (const dir of (await dirsIn("strategies")).filter((d) => d.startsWith("ec-"))) {
    for (const f of await sourcesIn(`strategies/${dir}/src`)) {
      if (/type:\s*["']limit["']/.test(await read(f))) offenders.push(f);
    }
  }
  return offenders.length
    ? bad("no-taker-limit", offenders.join(", "), "Taker bots must send IOC — see docs/event-contracts.md sharp edge 4.")
    : ok("no-taker-limit");
}

/**
 * Sharp edge 8: a window minutes from close can lock between the snapshot and
 * the send. Every bot that places an order gates on how much window is left.
 */
async function headroomGate() {
  const placers = (await dirsIn("strategies")).filter((d) => d.startsWith("ec-") && d !== "ec-settlement");
  const missing = [];
  for (const dir of placers) {
    let src = "";
    for (const f of await sourcesIn(`strategies/${dir}/src`)) src += await read(f);
    if (!/minLeftSec|minLeftFor|headroomSec|NEAR_EXPIRY|FLATTEN_BUFFER|EC_MIN_LEFT/.test(src)) missing.push(dir);
  }
  return missing.length
    ? bad("headroom-gate", missing.join(", "), "See docs/event-contracts.md sharp edge 8.")
    : ok("headroom-gate", `${placers.length} placers`);
}

/** The published contracts table: docs.dreamdex.io/developers/event-contracts/contracts-and-addresses */
const PUBLISHED_ADDRESSES = {
  binaryModule: "0x3ecC694Cef705358864a646142ac17A90E29e388",
  marketsCore: "0x2802504314685D89bF6C992CA5a8e7cC78bc0294",
  binarySettlement: "0xbF4a49e0Dfd092e5FBE8E5761064C49533e6Ed23",
  oracleHub: "0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b",
  collateralRouter: "0xbC0C9834B15ACE38bB50dDaa7d7f7C7CC4DC183C",
  usdso: "0x00000022dA000002656c64D9eA6011ea952D008A",
};

async function ecAddresses() {
  const text = await read("packages/ec-core/src/addresses.ts");
  const missing = Object.entries(PUBLISHED_ADDRESSES)
    .filter(([, addr]) => !text.includes(addr))
    .map(([name]) => name);
  return missing.length
    ? bad("ec-addresses", `drifted from the docs: ${missing.join(", ")}`)
    : ok("ec-addresses", `${Object.keys(PUBLISHED_ADDRESSES).length} match`);
}

/**
 * The SDK floor.
 *
 * 0.23.0 is a hard floor, not a preference: the indexer dropped the
 * `longOpenInterest` column that 0.22 and below still select, so every market
 * read fails outright on those. The old rule allowed anything from 0.20, which
 * would have passed a pin straight into that.
 */
const SDK_FLOOR = [0, 23, 0];

async function sdkFloor() {
  const pkg = JSON.parse(await read("packages/ec-core/package.json"));
  const raw = pkg.dependencies?.["@somnia-chain/markets-sdk"] ?? "";
  const m = String(raw).match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return bad("sdk-floor", `need >= ${SDK_FLOOR.join(".")}, got ${raw || "(missing)"}`);
  const got = m.slice(1, 4).map(Number);
  const cmp = got[0] - SDK_FLOOR[0] || got[1] - SDK_FLOOR[1] || got[2] - SDK_FLOOR[2];
  return cmp >= 0 ? ok("sdk-floor", raw) : bad("sdk-floor", `need >= ${SDK_FLOOR.join(".")}, got ${raw}`);
}

/**
 * A knob shared across a family is read by all of it, or by none.
 *
 * `EC_UNDERLYING` was honoured by two of the four order-placing EC bots. The
 * other two accepted it in their config and traded every underlying anyway, so
 * anything generating configs offered a filter that silently did nothing.
 * Half-support is worse than no support: it reads as a capability.
 */
const SHARED_KNOBS = { "ec-": ["EC_UNDERLYING"] };

async function sharedKnobs() {
  const problems = [];
  for (const [prefix, knobs] of Object.entries(SHARED_KNOBS)) {
    const family = (await dirsIn("strategies")).filter((d) => d.startsWith(prefix) && d !== "ec-settlement");
    for (const knob of knobs) {
      const reads = [];
      for (const dir of family) {
        let src = "";
        for (const f of await sourcesIn(`strategies/${dir}/src`)) src += await read(f);
        if (src.includes(knob)) reads.push(dir);
      }
      if (reads.length > 0 && reads.length < family.length) {
        const silent = family.filter((d) => !reads.includes(d));
        problems.push(`${knob}: accepted by config but ignored in ${silent.join(", ")}`);
      }
    }
  }
  return problems.length ? bad("shared-knobs", problems.join("; ")) : ok("shared-knobs");
}

/** A strategy nobody wrote up is a strategy nobody runs. */
async function strategyDocs() {
  const strategies = await dirsIn("strategies");
  const problems = [];
  for (const dir of strategies) {
    try {
      await read(`strategies/${dir}/README.md`);
    } catch {
      problems.push(`${dir}: no README`);
    }
  }
  const ecDoc = await read("docs/event-contracts.md");
  for (const dir of strategies.filter((d) => d.startsWith("ec-"))) {
    if (!ecDoc.includes(dir)) problems.push(`${dir}: absent from docs/event-contracts.md`);
  }
  return problems.length ? bad("strategy-docs", problems.join("; ")) : ok("strategy-docs", `${strategies.length} strategies`);
}

const CHECKS = [
  railwayAllowed,
  npmScriptsExist,
  envDocumented,
  marketStatusEnum,
  noTakerLimit,
  headroomGate,
  ecAddresses,
  sdkFloor,
  sharedKnobs,
  strategyDocs,
];

const results = [];
for (const run of CHECKS) {
  const r = await run().catch((e) => bad(run.name, e.message));
  results.push(r);
  console.log(`${r.id.padEnd(16)} ${r.pass ? "PASS" : "FAIL"}  ${r.detail}`);
  if (!r.pass && r.log && process.env.CHECKS_VERBOSE === "1") console.log(r.log);
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
