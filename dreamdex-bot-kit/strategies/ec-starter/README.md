# ec-starter — event contracts taker

The 5-minutes-to-first-bot for Event Contracts: each cycle it walks the
DreamDEX venue's live Up/Down windows, gates on the ON-CHAIN market status,
seeds inventory once via mint-a-pair, and crosses a resting quote.

```bash
npm start -w ec-starter        # DRY_RUN=true by default
```

Env: `PRIVATE_KEY` (funded, testnet STT + tUSDC via faucet), `DEPLOY_ENV`
(`testnet` default), `TAKE_INTERVAL_MS`, `TAKE_MAX_SHARES`, `DRY_RUN`.

Read the sharp edges in [`docs/event-contracts.md`](../../docs/event-contracts.md) before going live.
