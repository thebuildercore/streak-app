# EC bot test report

Plumbing conformance test for the six `ec-*` strategies in this kit. **Not a trading performance endorsement.**

## 1. Summary


| Bot              | G0   | G1 dry | G2 testnet wet                         | G3 mainnet smoke | Verdict     |
| ---------------- | ---- | ------ | -------------------------------------- | ---------------- | ----------- |
| ec-starter       | pass | pass   | **pass** (crosses + D1 re-verify)      | **pass**         | Plumbing OK |
| ec-maker         | pass | pass   | **pass** (26 quotes)                   | **pass**         | Plumbing OK |
| ec-passive       | pass | pass   | **pass** (rested bids + window rolls)  | **pass**         | Plumbing OK |
| ec-settlement    | pass | pass   | **pass** (watch + claim + E2E redeem)  | **pass**         | Plumbing OK |
| ec-oracle-follow | pass | pass   | **pass** (3 takes + heartbeats)        | feed guard pass  | Plumbing OK |
| ec-laddering-bot | pass | pass   | **pass** (ladder + window follow)      | **pass**         | Plumbing OK |


**Verdict:** All three gates pass, under assertions that can fail.

- **Gate 1:** 9/9 dry-run cases
- **Gate 2:** 9/9 wet testnet cases, every one exiting 0 and leaving no new open orders
- **Gate 3:** 6/6 mainnet smoke, each case ending with zero open orders

An earlier version of this report also read 9/9, before four cases had any `must`
at all and while the open-order check silently scored "unknown" as clean. The
numbers above come from assertions that failed real defects first (D5-D8).

Evidence under `[artifacts/](../../artifacts/)` (gitignored).

## 2. Environment as-tested


| Field                          | Value                                                                 |
| ------------------------------ | --------------------------------------------------------------------- |
| Git commit                     | `fabri-ec-testing`, gates tightened                                   |
| Date (UTC)                     | 2026-08-06                                                            |
| `NETWORK` (testnet runs)       | testnet (chain 50312)                                                 |
| Testnet `VENUE_ID`             | `0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c`  |
| Mainnet `VENUE_ID` (Gate 3)    | `0x458b30c2d72bfd2c6317304a4594ecbafe5f729d3111b65fdc3a33bd48e5432d`  |
| `@somnia-chain/markets-sdk`    | `^0.22.0` (0.23.0 breaks every market read against the deployed indexers — `field 'fundingWindowSec' not found`) |
| Wallet A (`PRIVATE_KEY`)       | `0x4b051B…539580`                                                     |
| Wallet B (`TAKER_PRIVATE_KEY`) | `0xC48CC1…516d632` (counterparty ec-maker)                            |


## 3. Gate results

Evidence lives under `[artifacts/](../../artifacts/)`. Each run produces `<case>-<timestamp>.log` and `.json`.

### Gate 0 — static

- `npm run typecheck`
- All six `ec-*` names in `[scripts/railway-start.mjs](../../scripts/railway-start.mjs)` `ALLOWED` set

### Gate 1 — dry run (testnet, no keys)

**Pass (9/9).** Harness strips keys in child env; bots still read `VENUE_ID` from root `.env`. Negative cases: stale venue, mainnet oracle feed guard — and the stale-venue case now also asserts that a bogus venue places NO orders, not merely that the bot survives.

### Gate 2 — wet testnet

**Pass (9/9)** at `EC_TEST_DURATION_MS=180000`. The two long cases carry a 10-minute floor the override cannot undercut: they wait on the venue's clock, and shortening them asks for an event that cannot have happened yet.


| Case                   | Key evidence                                                               |
| ---------------------- | -------------------------------------------------------------------------- |
| g2-ec-maker            | 26 live `quote … bid … / ask …` lines                                      |
| g2-ec-starter          | `buy`/`sell` crosses vs counterparty maker; D1 re-verify pass              |
| g2-ec-passive          | `rested … buy 5@0.350` post-only bids                                      |
| g2-ec-passive-long     | 3× `window rolled:` lines in 5 min                                         |
| g2-ec-laddering-bot    | ladder / heartbeat lines                                                   |
| g2-ec-laddering-long   | 2× `following window:` (BTC ↔ ETH daily roll)                              |
| g2-ec-oracle-follow    | `BUY_NO 5/5`, `BUY_YES 5/5` with `why` strings                             |
| g2-ec-settlement-watch | lifecycle watch                                                            |
| g2-ec-settlement-claim | `scanning 25 recently settled market(s)`                                   |
| settlement E2E         | buy window → wait → `CLAIM=1` redeem (205 YES redeemed on BTC 60s)         |


**Notes:**

- Run cases **sequentially** with 15s gap — parallel runs caused `nonce too low`.
- Shutdown is asserted, not excused. The 8s kill grace was cutting bots off mid-cleanup and recording the signal as exit 1; it is now 30s and every long-running case requires exit 0.
- The post-run open-order check retries once under RPC load. If it still cannot read, the case FAILS: a leak check that did not run is not a clean book.

### Gate 3 — mainnet micro-smoke

**Pass (6/6)** with `EC_ALLOW_MAINNET=1`, mainnet `VENUE_ID`, `EC_TEST_DURATION_MS=90000`. Sizes are deliberately small (0.05 share quotes, 0.02 ladder rungs, 0.05 seed) because every order is real money: the whole gate costs about 0.7 USDso. Each case now ends with the open-order check pointed at mainnet, and every one finished at zero.

| Case              | Key evidence                                      |
| ----------------- | ------------------------------------------------- |
| g3-ec-maker       | live quotes; mainnet tx hashes in log             |
| g3-ec-starter     | startup + mainnet txs                             |
| g3-ec-passive     | passive behaviour on mainnet                      |
| g3-ec-laddering   | ladder activity on mainnet venue                  |
| g3-ec-settlement  | watch / scan on mainnet                           |
| g3-oracle-no-feed | `No price feed configured` (expected guard)       |

First Gate 3 attempt failed (4/6) because matrix lacked mainnet `VENUE_ID` — bots scoped to testnet venue on mainnet RPC. Fixed in `c1272b5`.

## 4. Gotcha conformance ([event-contracts.md](../event-contracts.md))


| #   | Sharp edge                                               | Status           | Evidence                                           |
| --- | -------------------------------------------------------- | ---------------- | -------------------------------------------------- |
| 1   | Gate on on-chain status, not indexer                     | verified (G2)    | settlement watch + oracle takes on Trading markets |
| 2   | Reverted write does not throw (`assertTxOk`)             | verified (G2)    | orders landed; no silent reverts in logs           |
| 3   | No float price on 18-decimal venue (`placeLimit`)        | verified (G3)    | mainnet smoke on 18-decimal venue                  |
| 4   | IOC vs resting decision                                  | verified (G2)    | passive rests; oracle IOC; starter limit           |
| 5   | Order expiry mandatory                                   | partial          | passive sets `expiresInSec`                        |
| 6   | Size to lot grid (`quantize`)                            | verified (G2/G3) | 5-share testnet; 1-share mainnet                   |
| 7   | Reconcile against the wallet; check balance before signing | verified         | escrow returned to the wallet on cancel (mainnet); taker charged the fill price, not the offer (testnet); vault read 0 throughout |
| 8   | Expiry headroom scales to window                         | verified (G2)    | passive picked 1200 window with headroom           |
| 9   | Indexer lags; poll with deadline                         | observed (G1/G2) | recoverable `cycle error: fetch failed`            |
| 10  | Markets recycle; key by `marketId`/symbol                | verified (G2)    | window rolls in long passive/laddering runs        |
| 11  | `settledMarkets()` for claims, not `loadMarkets()`       | verified (G2)    | claim sweep + E2E redeem                           |
| 12  | Do not parse question text; use `strike` / `intervalSec` | verified (G2)    | oracle `opening … vs spot` in why strings          |


## 5. Defects and doc gaps


| ID  | Severity | Description                                                              | Status   |
| --- | -------- | ------------------------------------------------------------------------ | -------- |
| D1  | medium   | `ec-starter` — no shutdown cancel for resting `limit` remainders         | **fixed** (`c1272b5`; re-verify pass) |
| D2  | low      | `ec-laddering-bot` — `explainNoMarket` cites `DEPLOY_ENV` over `NETWORK` | **fixed** |
| D3  | low      | `docs/event-contracts.md` — missing `ec-laddering-bot` in strategy table | **fixed** |
| D4  | info     | Empty `VENUE_ID` infers when a single venue is live on testnet           | open     |
| D6  | medium   | `ec-maker` and `ec-starter` were silent when the venue matched no markets | **fixed** — a stale `VENUE_ID` produced no output at all. Both now print `explainEmptyScope` (shared in ec-core), throttled to once a minute. The gate-1 stale-venue case asserts it. |
| D7  | medium   | Shutdown asked the indexer what was resting, so it missed its own last orders | **fixed** — the indexer runs seconds behind and the orders needing cancellation are the ones sent seconds ago. ec-starter stranded 3 while logging "canceled 0"; ec-maker stranded 1 while logging "canceled 14". `placeLimit` now records what rested and `cancelTracked` pulls it. Both measured at 21 open before and 21 after. |
| D8  | low      | `g2-ec-laddering-long` required a window roll the bot is designed not to make | **fixed** — `pickMarket` takes the longest-lived window on purpose, so the bot settles on a daily series and correctly never rolls. The case now asserts ladder upkeep over a long run; the roll is a `should`. |
| D9  | medium   | The gate-3 leak check read the wrong chain                                | **fixed** — `post-check` inherited only the shell environment, so it counted TESTNET open orders while the bot traded mainnet. It now inherits the case's `NETWORK` / `VENUE_ID`. The first honest reading showed ec-starter stranding 7 orders on mainnet. |
| D10 | medium   | `ec-starter` stranded orders the SDK never returned an id for             | **fixed** — an order can rest on-chain while the placing call throws on the way back (seen on mainnet as `Missing or invalid parameters`), leaving nothing to record. Shutdown now cancels from its record AND sweeps, the same belt-and-braces ec-maker uses. Measured 7 → 0. |
| D11 | medium   | No gas preflight: an empty tank looked like a parameter error              | **fixed** — the node says "insufficient balance", viem wraps it as "Missing or invalid parameters", and the bot repeats that once per market per cycle. 24 identical lines went by before anyone checked the native balance. `placeLimit` reads it first and says "out of gas" with the address. |
| D12 | —        | Natacha's release-readiness register (D1-D8) closed                        | **fixed** — window gate on maker/starter, starter sends IOC, net-position caps on both, venue-scoped shutdown sweep, settledMarkets refuses an ambiguous venue, `envNum` rejects a non-numeric knob, no fee read from a recycled pool, dry-run no longer counts claims. See `ec-release-readiness.md` for the original findings. |
| D5  | medium   | `post-check.ts` never exited, so the leak check always timed out          | **fixed** — it printed its answer and then hung on an unclosed websocket; it now exits explicitly, and queries only the binary portfolio instead of sweeping spot and perp too. Runs in ~4s. |


## 6. Non-goals

- P&L, fill rate, or edge quality
- Latency / throughput benchmarks
- Adversarial or multi-instance behaviour
- 24/7 soak reliability
- Mainnet capital efficiency

## 7. Reproduction

```bash
npm run ec:doctor
npm run typecheck
npm run ec:test -- --gate=1
npm run ec:test -- --gate=2
EC_ALLOW_MAINNET=1 npm run ec:test -- --gate=3
npm run ec:test:settlement-e2e
npm run ec:test:report
```

Shorter runs: `EC_TEST_DURATION_MS=180000 npm run ec:test -- --gate=2`

<!-- AUTO_RESULTS_START -->
## Automated run summary (generated)

_Gates last merged: 2026-08-07T12:16:16.220Z_

### Gate 1
| Case | Bot | Pass | Exit | Log |
|------|-----|------|------|-----|
| g1-ec-laddering-bot | ec-laddering-bot | yes | 0 | `artifacts/g1-ec-laddering-bot-2026-08-06T22-53-55-927Z.log` |
| g1-ec-maker | ec-maker | yes | 0 | `artifacts/g1-ec-maker-2026-08-06T22-51-21-485Z.log` |
| g1-ec-oracle-follow | ec-oracle-follow | yes | 0 | `artifacts/g1-ec-oracle-follow-2026-08-06T22-53-10-389Z.log` |
| g1-ec-passive | ec-passive | yes | 0 | `artifacts/g1-ec-passive-2026-08-06T22-52-06-727Z.log` |
| g1-ec-settlement | ec-settlement | yes | 0 | `artifacts/g1-ec-settlement-2026-08-06T22-52-52-191Z.log` |
| g1-ec-starter | ec-starter | yes | 0 | `artifacts/g1-ec-starter-2026-08-06T22-50-36-298Z.log` |
| g1-fail-no-venue | ec-maker | yes | 0 | `artifacts/g1-fail-no-venue-2026-08-06T22-54-42-247Z.log` |
| g1-fail-oracle-mainnet-feed | ec-oracle-follow | yes | 1 | `artifacts/g1-fail-oracle-mainnet-feed-2026-08-06T22-56-13-321Z.log` |
| g1-fail-stale-venue | ec-maker | yes | 0 | `artifacts/g1-fail-stale-venue-2026-08-06T22-55-27-800Z.log` |



### Gate 2
| Case | Bot | Pass | Exit | Log |
|------|-----|------|------|-----|
| g2-ec-laddering-bot | ec-laddering-bot | yes | 0 | `artifacts/g2-ec-laddering-bot-2026-08-07T11-17-15-828Z.log` |
| g2-ec-laddering-long | ec-laddering-bot | yes | 0 | `artifacts/g2-ec-laddering-long-2026-08-07T11-28-24-892Z.log` |
| g2-ec-maker | ec-maker | yes | 0 | `artifacts/g2-ec-maker-2026-08-07T11-06-41-856Z.log` |
| g2-ec-oracle-follow | ec-oracle-follow | yes | 0 | `artifacts/g2-ec-oracle-follow-2026-08-07T11-20-43-150Z.log` |
| g2-ec-passive | ec-passive | yes | 0 | `artifacts/g2-ec-passive-2026-08-07T11-13-48-220Z.log` |
| g2-ec-passive-long | ec-passive | yes | 0 | `artifacts/g2-ec-passive-long-2026-08-07T11-38-49-746Z.log` |
| g2-ec-settlement-claim | ec-settlement | yes | 0 | `artifacts/g2-ec-settlement-claim-2026-08-07T11-27-52-627Z.log` |
| g2-ec-settlement-watch | ec-settlement | yes | 0 | `artifacts/g2-ec-settlement-watch-2026-08-07T11-24-31-219Z.log` |
| g2-ec-starter | ec-starter | yes | 0 | `artifacts/g2-ec-starter-2026-08-07T11-10-12-556Z.log` |
| g2-ec-settlement-e2e | undefined | yes | — | `` |



### Gate 3
| Case | Bot | Pass | Exit | Log |
|------|-----|------|------|-----|
| g3-ec-laddering-bot | ec-laddering-bot | yes | 0 | `artifacts/g3-ec-laddering-bot-2026-08-07T12-07-10-297Z.log` |
| g3-ec-maker | ec-maker | yes | 0 | `artifacts/g3-ec-maker-2026-08-07T12-03-46-476Z.log` |
| g3-ec-passive | ec-passive | yes | 0 | `artifacts/g3-ec-passive-2026-08-07T12-05-32-323Z.log` |
| g3-ec-settlement | ec-settlement | yes | 0 | `artifacts/g3-ec-settlement-2026-08-07T12-08-53-144Z.log` |
| g3-ec-starter | ec-starter | yes | 0 | `artifacts/g3-ec-starter-2026-08-07T12-02-09-041Z.log` |
| g3-oracle-no-feed | ec-oracle-follow | yes | 1 | `artifacts/g3-oracle-no-feed-2026-08-07T12-10-36-551Z.log` |


<!-- AUTO_RESULTS_END -->
