# Event contracts

Binary Up/Down markets on BTC and ETH price, trading on the same on-chain order
book as spot but through a different SDK. The `ec-*` strategies are the event
contract half of this kit.

Protocol reference: [docs.dreamdex.io/developers/event-contracts](https://docs.dreamdex.io/developers/event-contracts).

## How they differ from the spot strategies

They use their own core, `@dreamdex-bot-kit/ec-core`, built on
[`@somnia-chain/markets-sdk`](https://www.npmjs.com/package/@somnia-chain/markets-sdk)
rather than the spot contracts. Spot paths are untouched; the two sides share
only the repo and the Railway entrypoint.

| Strategy | What it does |
|---|---|
| `ec-starter` | The hello world: read a market, cross a resting quote. |
| `ec-maker` | Two-sided post-only quoting around a fair probability. |
| `ec-passive` | One resting bid at your price, never crosses the spread. |
| `ec-settlement` | Follows one market to expiry, or sweeps every settled one with `CLAIM=1`. |
| `ec-oracle-follow` | Prices from the underlying spot and takes a directional view. |
| `ec-laddering-bot` | Resting probability ladder; flattens before expiry. |

Run them exactly like the spot ones: `npm start -w ec-maker`, or set
`STRATEGY=ec-maker` on Railway.

## Winnings are claimed, not received

A settled market pays out only when someone asks it to. The position does not
decay into collateral on its own, so a bot that trades for a week and never
redeems has its balance spread across dozens of finalised markets while its
wallet reads near zero.

Every strategy therefore claims as it goes: each loop calls `maybeClaim`, which
sweeps recently settled markets and redeems whatever is claimable. Defaults:

```bash
AUTO_CLAIM=true             # set false to opt out
AUTO_CLAIM_INTERVAL_MS=600000   # sweep at most every 10 minutes
CLAIM_SCAN=25               # how many recently settled markets to check
```

It is a loop call rather than a background timer on purpose. Claiming signs
from the same key the strategy trades with, and two senders on one key race
each other's nonce. Running it inside the loop serialises it for free — which
is also why you should not run two bots on one key.

`ec-settlement` still exists for a one-shot sweep (`CLAIM=1 npm start -w
ec-settlement`), useful after a bot has been off for a while.

## Configure the venue

One deployment hosts several venues, and markets from all of them sit side by
side in the indexer. Set `VENUE_ID` or the bots will refuse to guess — and note
it **differs per network**:

```bash
# testnet
VENUE_ID=0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c
# mainnet
VENUE_ID=0x458b30c2d72bfd2c6317304a4594ecbafe5f729d3111b65fdc3a33bd48e5432d
```

**These move.** Both networks changed venue three times in the first week of
August, and for a while they shared one id before diverging again. Treat the
values above as a starting point: if a bot reports no markets, or errors that
live markets span several venues, read the venueId off a live market row.

`NETWORK=testnet|mainnet` picks the deployment, the same as the spot side.

## Sharp edges

These are the ones that cost real time. The
[protocol gotchas page](https://docs.dreamdex.io/developers/event-contracts/gotchas)
covers each in more depth.

1. **Gate on the on-chain market status, not the indexer.** The indexer lags by
   seconds. Only a market in `Trading` (status 1) accepts orders.

2. **A reverted write does not throw.** SDK writes skip simulation and resolve
   even when the transaction reverted. On the unified tier the receipt is not on
   the returned order, it rides on `info` — `ec-core`'s `assertTxOk` handles it.

3. **Never hand the SDK a float price on an 18-decimal venue.** The unified
   `createOrder` converts with `parseUnits(price.toFixed(18), 18)`, and
   `(0.05).toFixed(18)` is `"0.050000000000000003"` — three wei off the tick
   grid, which the pool rejects with `InvalidPrice`. Measured on mainnet: of
   fifteen ordinary probabilities only 0.25, 0.5 and 0.75 survive. A 6-decimal
   venue never shows this, so testnet looks clean. Use `placeLimit` from
   `ec-core`, which converts in tick and lot units as integers and sends through
   the raw tier.

4. **IOC or resting is a decision.** An unfilled limit remainder rests with
   escrow locked, invisibly if you are not tracking open orders.

5. **Order expiry is mandatory.** Every order carries `expireTimestampNs`,
   capped at the market's own expiry. Set it just past your requote interval and
   a crashed bot's orders age off the book by themselves.

6. **Size to the venue's lot grid yourself.** The SDK's generic
   `amountToPrecision` skips lot sizing on binary markets and snaps to whole
   contracts, which floors small sizes to zero on an 18-decimal venue. Use
   `quantize` from `ec-core`.

7. **Reconcile against the wallet.** Escrow leaves the wallet and comes back to
   it: cancel a resting bid and the exact escrow returns (measured on mainnet),
   and a taker is charged the fill price rather than the price it offered (paid
   0.945 on a 0.98 bid against a 0.945 ask, on testnet). The per-pool vault is a
   payout *fallback* and reads 0 in normal operation, though placement draws it
   first when it does hold something.

   `placeLimit` checks the wallet before it signs, so an underfunded buy or a
   sell with no inventory fails locally instead of reverting on-chain and
   burning gas.

8. **Scale expiry headroom to the window.** A window minutes from close can lock
   between your snapshot and your send. But a fixed threshold breaks the other
   way: 300 seconds of headroom rejects every market on a venue running
   5-minute windows. The `ec-*` strategies scale it to a fraction of the series
   interval.

9. **Indexer rows lag the chain by seconds.** Poll with a deadline rather than
   trusting a single read, and treat the chain as the source of truth for
   anything you act on.

10. **Markets die on schedule and respawn.** Key state by `marketId` or symbol,
   never by pool address — pools are recycled across windows.

11. **`loadMarkets()` cannot find your winnings.** A settled market leaves the
   live list, and through markets-sdk 0.22 the registry sweep skips finalized
   binaries outright, so filtering `loadMarkets()` for inactive rows returns an
   empty set — a redeem-by-scan bot silently finds nothing to claim. The binary
   tier does carry them, under the status `"Finalized"`:
   `client.listBinaryMarkets({ venueId, status: "Finalized" })`. `ec-core`'s
   `settledMarkets()` wraps that call, and every strategy claims from it once a
   cycle (see above).

12. **Do not parse the question text.** Its wording has changed several times.
    Read the `strike` and `intervalSec` fields instead.

## Known limitation

`ec-oracle-follow` needs the underlying BTC/ETH price, which no market row
carries. The SDK bundles a price-feed endpoint for testnet only, so on mainnet
the strategy exits at startup until either a mainnet feed exists or you wire
`restSpotReader` in `signal.ts` to an exchange ticker of your choice. The other
four strategies run on both networks.
