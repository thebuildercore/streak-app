# ec-settlement — lifecycle watcher + claim sweep

Follows a market to resolution and redeems (explicit outcome index — required
on voided markets, where both sides refund at 0.5). Settled markets drop out
of the live list, so winnings hide: `CLAIM=1` sweeps recent settled markets
for anything the wallet is owed.

```bash
npm start -w ec-settlement            # watch one market to settlement
CLAIM=1 npm start -w ec-settlement    # sweep unclaimed winnings
```

Env: `PRIVATE_KEY` (optional — reports only without it), `EC_MARKET`,
`WATCH_POLL_MS`, `CLAIM_SCAN`, `DRY_RUN`.
