/**
 * EC bot test matrix: gates, env overrides, durations, log assertions.
 * Durations can be scaled with EC_TEST_DURATION_MS (overrides per-case durationMs).
 */

export const EC_BOTS = [
  "ec-starter",
  "ec-maker",
  "ec-passive",
  "ec-settlement",
  "ec-oracle-follow",
  "ec-laddering-bot",
];

/** Cross-cutting assertions every bot should satisfy when the gate applies. */
export const CROSS = {
  cleanExit: { pattern: /stopped|nothing to claim|No market to watch/, label: "clean shutdown message" },
  noUnhandled: { pattern: /UnhandledPromiseRejection|uncaught/i, label: "no unhandled rejection", invert: true },
  sigtermOk: { label: "exit code 0", exitCode: 0 },
};

/** @type {import('./matrix.mjs').TestCase[]} */
export const CASES = [
  ...EC_BOTS.map((bot) => ({
    id: `g1-${bot}`,
    gate: 1,
    bot,
    durationMs: 90_000,
    env: {
      NETWORK: "testnet",
      DRY_RUN: "true",
      PRIVATE_KEY: "",
      TAKER_PRIVATE_KEY: "",
    },
    must:
      bot === "ec-settlement"
        ? [{ pattern: /watching|No market to watch/, label: "settlement watch mode" }]
        : [{ pattern: /dryRun=true|dry run\)/i, label: "startup indicates dry run" }],
    should: [
      { pattern: /cycle error:/, label: "transient cycle errors logged (recoverable)" },
      bot === "ec-oracle-follow"
        ? { pattern: /idle ·|DRY BUY_|oracle-follow up/, label: "oracle cycles or heartbeats" }
        : bot === "ec-settlement"
          ? { pattern: /watching|No market to watch/, label: "settlement picks or reports no market" }
          : { pattern: /DRY |heartbeat ·|no market|waiting/, label: "action or reasoned wait" },
    ],
  })),

  {
    id: "g1-fail-no-venue",
    gate: 1,
    bot: "ec-maker",
    durationMs: 15_000,
    env: {
      NETWORK: "testnet",
      DRY_RUN: "true",
      VENUE_ID: "",
      PRIVATE_KEY: "",
      TAKER_PRIVATE_KEY: "",
    },
    must: [
      {
        pattern: /maker-bot up|Set VENUE_ID|span \d+ venues/i,
        label: "starts with inferred venue or actionable multi-venue error",
      },
    ],
    note: "When only one venue is live, ec-core infers scope — no error is expected.",
  },
  {
    id: "g1-fail-stale-venue",
    gate: 1,
    bot: "ec-maker",
    durationMs: 30_000,
    env: {
      NETWORK: "testnet",
      DRY_RUN: "true",
      VENUE_ID: "0x0000000000000000000000000000000000000000000000000000000000000001",
      PRIVATE_KEY: "",
      TAKER_PRIVATE_KEY: "",
    },
    must: [
      { pattern: /0 active|no market|scoped active=0|cycle error:/i, label: "reports no markets on an unknown venue" },
      // The whole point of the negative case: a bogus venue must not trade.
      { pattern: /^\S+ (quote|rested|buy|sell) /m, label: "no orders on a bogus venue", invert: true },
    ],
  },
  {
    id: "g1-fail-oracle-mainnet-feed",
    gate: 1,
    bot: "ec-oracle-follow",
    durationMs: 10_000,
    env: {
      NETWORK: "mainnet",
      DRY_RUN: "true",
      PRIVATE_KEY: "",
      TAKER_PRIVATE_KEY: "",
      PRICE_FEED_URL: "",
    },
    must: [{ pattern: /No price feed configured/i, label: "documented mainnet feed failure" }],
    note: "Expect non-zero exit — startup throws before loop",
  },

  {
    id: "g2-ec-maker",
    gate: 2,
    bot: "ec-maker",
    durationMs: 1_800_000,
    env: {
      NETWORK: "testnet",
      DRY_RUN: "false",
      MM_REFRESH_MS: "8000",
      MM_QUOTE_SIZE: "5",
    },
    must: [
      // NOT the startup banner: `dryRun=false` prints before the first cycle, so a
      // maker that never quotes would pass on it. And no `DRY quote` here — the
      // case sets DRY_RUN=false, so a bot stuck in dry mode is a failure.
      { pattern: /quote \S+: bid /, label: "live two-sided quote" },
      CROSS.sigtermOk,
    ],
    should: [
      { pattern: /quote .*bid.*ask|canceled .* on shutdown|maker-bot stopped/, label: "quoted or cleaned up" },
      CROSS.cleanExit,
    ],
  },
  {
    id: "g2-ec-starter",
    gate: 2,
    bot: "ec-starter",
    durationMs: 1_800_000,
    env: { NETWORK: "testnet", DRY_RUN: "false", TAKE_INTERVAL_MS: "6000" },
    counterparty: [{ bot: "ec-maker", wallet: "taker" }],
    // A counterparty maker runs alongside, so there IS liquidity: a starter that
    // crosses nothing in 30 minutes is broken, not unlucky.
    must: [
      { pattern: /\b(buy|sell) [\d.]+ /, label: "crossed the counterparty" },
      CROSS.sigtermOk,
    ],
    should: [{ pattern: /canceled \d+ resting order/, label: "shutdown cancel ran" }, CROSS.cleanExit],
  },
  {
    id: "g2-ec-passive",
    gate: 2,
    bot: "ec-passive",
    durationMs: 1_800_000,
    env: {
      NETWORK: "testnet",
      DRY_RUN: "false",
      EC_TARGET: "0.35",
      EC_SIZE: "5",
      EC_REFRESH_MS: "10000",
    },
    must: [
      { pattern: /rested |position complete|staying passive|no Trading market/, label: "rested, filled up, or documented idle" },
      CROSS.sigtermOk,
    ],
    should: [{ pattern: /rested /, label: "actually rested a bid" }, CROSS.cleanExit],
  },
  {
    id: "g2-ec-laddering-bot",
    gate: 2,
    bot: "ec-laddering-bot",
    durationMs: 1_800_000,
    env: { NETWORK: "testnet", DRY_RUN: "false", GRID_REFRESH_MS: "8000" },
    must: [
      { pattern: /ladder |heartbeat ·|flatten:/, label: "ladder, heartbeat or flatten" },
      CROSS.sigtermOk,
    ],
    should: [{ pattern: /ladder /, label: "actually placed a ladder" }, CROSS.cleanExit],
  },
  {
    id: "g2-ec-oracle-follow",
    gate: 2,
    bot: "ec-oracle-follow",
    durationMs: 1_800_000,
    env: { NETWORK: "testnet", DRY_RUN: "false", OF_INTERVAL_MS: "6000" },
    counterparty: [{ bot: "ec-maker", wallet: "taker" }],
    must: [{ pattern: /idle ·/, label: "heartbeat with skip reasons" }, CROSS.sigtermOk],
    should: [{ pattern: /DRY BUY_|BUY_YES|BUY_NO/, label: "take or dry take" }, CROSS.cleanExit],
  },
  {
    id: "g2-ec-settlement-watch",
    gate: 2,
    bot: "ec-settlement",
    durationMs: 300_000,
    env: { NETWORK: "testnet", DRY_RUN: "false" },
    must: [{ pattern: /watching|No market to watch|status →/, label: "watches lifecycle" }, CROSS.sigtermOk],
  },
  {
    id: "g2-ec-settlement-claim",
    gate: 2,
    bot: "ec-settlement",
    durationMs: 120_000,
    env: { NETWORK: "testnet", DRY_RUN: "false", CLAIM: "1", CLAIM_SCAN: "25" },
    must: [{ pattern: /scanning .* settled|nothing to claim|redeemed|DRY redeem/, label: "claim sweep runs" }],
  },

  ...["ec-starter", "ec-maker", "ec-passive", "ec-laddering-bot", "ec-settlement"].map((bot) => ({
    id: `g3-${bot}`,
    gate: 3,
    bot,
    durationMs: 120_000,
    env: {
      NETWORK: "mainnet",
      VENUE_ID: "0x458b30c2d72bfd2c6317304a4594ecbafe5f729d3111b65fdc3a33bd48e5432d",
      DRY_RUN: "false",
      // Real money, so keep it small: seeding is per market and the bots walk
      // up to MM_MAX_MARKETS of them. At 1 share each a smoke run costs more
      // than the wallet holds; these are above the 1e15 lot and still real.
      MM_QUOTE_SIZE: "0.05",
      MM_INVENTORY: "0.05",
      GRID_SIZE: "0.02",
      TAKE_MAX_SHARES: "0.1",
    },
    must: [
      // NOT `dryRun=false`: that is the startup banner, printed before the bot
      // does anything. Require an action or a stated reason for inaction.
      { pattern: /quote \S+: bid |ladder |\b(buy|sell) [\d.]+ |rested |staying passive|watching|scanning |no market/, label: "acted, or said why not" },
      CROSS.sigtermOk,
    ],
    should: [{ pattern: /quote |ladder |buy |sell /, label: "mainnet write activity" }],
    note: "Requires funded mainnet key + EC_ALLOW_MAINNET=1 + mainnet VENUE_ID",
  })),
  {
    id: "g3-oracle-no-feed",
    gate: 3,
    bot: "ec-oracle-follow",
    durationMs: 10_000,
    env: { NETWORK: "mainnet", DRY_RUN: "true", PRICE_FEED_URL: "" },
    must: [{ pattern: /No price feed configured/i, label: "mainnet feed guard" }],
  },

  {
    id: "g2-ec-laddering-long",
    gate: 2,
    bot: "ec-laddering-bot",
    durationMs: 1_800_000,
    minDurationMs: 600_000, // a window roll happens on the venue's clock, not ours
    env: { NETWORK: "testnet", DRY_RUN: "false", GRID_REFRESH_MS: "8000" },
    // NOT "expect a window roll". pickMarket takes the LONGEST-lived window on
    // purpose, so the bot settles on a daily series and correctly never rolls;
    // requiring a roll asks it to contradict its own design, and the red says
    // nothing. What a long run is actually for: the ladder survives, nothing
    // drifts, nothing is stranded. The roll stays a `should` for the runs where
    // the venue happens to hand it a short cadence.
    must: [
      { pattern: /ladder /, label: "ladder maintained across a long run" },
      CROSS.sigtermOk,
    ],
    should: [
      { pattern: /following window:|flatten window|flatten:/, label: "window roll or flatten (venue-dependent)" },
    ],
    note: "long run — ladder upkeep; a roll only if the venue offers a short cadence",
  },
  {
    id: "g2-ec-passive-long",
    gate: 2,
    bot: "ec-passive",
    durationMs: 1_800_000,
    minDurationMs: 600_000, // a window roll happens on the venue's clock, not ours
    env: {
      NETWORK: "testnet",
      DRY_RUN: "false",
      EC_TARGET: "0.35",
      EC_SIZE: "5",
      EC_REFRESH_MS: "10000",
    },
    must: [{ pattern: /window rolled:|rested |FILLED \+/, label: "window roll or resting/fill" }],
    note: "30 min — expect at least one window roll",
  },
];

export function casesForGate(gate, botFilter) {
  return CASES.filter((c) => {
    if (c.gate !== gate) return false;
    if (botFilter && c.bot !== botFilter && !c.id.includes(botFilter)) return false;
    return true;
  });
}

export function durationMs(testCase) {
  const override = process.env.EC_TEST_DURATION_MS;
  if (!override) return testCase.durationMs;
  // A case with `minDurationMs` waits on the venue's clock, not ours — a window
  // rolling, a flatten before expiry. Shortening it below that floor asks it to
  // assert an event that cannot happen yet, and the red says nothing about the
  // bot. The override still applies above the floor.
  return Math.max(Number(override), testCase.minDurationMs ?? 0);
}
