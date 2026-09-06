# ec-maker — two-sided post-only maker

Quotes a symmetric bid/ask around the book mid on every live Up/Down window,
refreshing each cycle (cancel stale, re-quote). Survived a 2h live soak on
testnet across 28 market rolls with zero errors. Swap `fairYes()` for your own
signal — the plumbing is the point.

```bash
npm start -w ec-maker
```

Env: `PRIVATE_KEY`, `DEPLOY_ENV`, `MM_SPREAD` (half-spread, default 0.02),
`MM_QUOTE_SIZE`, `MM_REFRESH_MS`, `MM_INVENTORY`, `DRY_RUN`. Keep
`MM_QUOTE_SIZE <= MM_INVENTORY` — the sell side escrows real outcome tokens.
