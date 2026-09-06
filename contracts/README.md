# Streak Contracts

Streak is an onchain reputation layer for prediction and event markets. It records a permanent prediction before market closure, links it to an authorized market outcome, and derives a transparent track record of wins, losses, and streaks.

## Architecture

```text
Human / AI / Bot Wallet -> PredictionManager -> Immutable Prediction
                                            ^                 |
                                            |                 v
                              DreamDEX Event Contract ------ WIN / LOSS
                                                                 |
                                                                 v
                                                      ReputationManager
```

## Contracts and lifecycle

- `PredictionManager.sol` accepts predictions from any wallet, stores the historical record, and resolves each prediction exactly once. There is intentionally no edit or delete function.
- `PredictionManager.sol` uses DreamDEX event IDs as the prediction keys. The configured DreamDEX Event Contract controls event openness and is the only contract allowed to settle an event.
- `ReputationManager.sol` accepts accounting calls only from `PredictionManager` and maintains totals, wins, losses, current streak, and best streak.

DreamDEX creates and settles the event. Any wallet submits a YES/NO value and confidence from 0 to 100 while the event is open. Once DreamDEX settles it, pending predictions become `Win` or `Loss`, and reputation accounting is updated. The wallet address may represent a human, AI agent, bot, or DAO.

## Reputation formula

Accuracy is returned in basis points: `wins * 10,000 / (wins + losses)`, and is zero before a result exists. The score, from 0 to 10,000, is:

```text
score = accuracyBps * 70 / 100
       + min(resolvedPredictions, 100) * 20
       + min(currentWinningStreak, 10) * 100
```

Accuracy contributes up to 7,000 points, resolved volume up to 2,000, and current consistency up to 1,000. The formula is isolated in `ReputationManager`; this MVP has no proxy or upgrade mechanism.

## Immutability, events, and security

User, market ID, direction, confidence, timestamp, and prediction ID are never modified after creation. No method deletes or replaces a prediction, so losing records cannot be cherry-picked. Essential state is stored onchain, with `PredictionCreated`, `PredictionResolved`, `MarketCreated`, `MarketResolved`, and `ReputationUpdated` events for indexers.

Module-specific authorization, one-time dependency configuration, zero-address checks, DreamDEX event validation, confidence bounds, and duplicate-resolution checks protect the core flow. No funds or untrusted callbacks are handled, so reentrancy protection is unnecessary here.

The configured DreamDEX Event Contract is an external trust boundary. Production use requires verifying the official DreamDEX deployment address and interface for the target chain, plus an audit of the integration. This code is not production-ready.

## Development and deployment

From this directory, install Foundry and the standard helpers, then run:

```bash
forge install foundry-rs/forge-std --no-commit
forge build
forge test
forge fmt --check
```

Use `forge test -vvv` for verbose failures. Tests cover creation, validation, IDs, authorization, resolution, duplicate resolution, reputation accounting, multi-user isolation, and confidence fuzzing.

Copy `.env.example` to `.env`, set `PRIVATE_KEY` and `RPC_URL`, and never commit the real key:

```bash
source .env
forge script script/Deploy.s.sol:Deploy --rpc-url "$RPC_URL" --broadcast
```

The deployment script deploys `PredictionManager` and `ReputationManager`, then connects them to the existing DreamDEX Event Contract supplied through `DREAMDEX_EVENT_CONTRACT`. Indexers, leaderboards, and analytics should consume DreamDEX and Streak events without adding a second market lifecycle here.