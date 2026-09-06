# @dreamdex-bot-kit/backtest

Bar-by-bar replay of DreamDEX strategies against historical OHLCV.

Strategies inject a `BotFactory` that receives a `SimPool` (same `place` / `cancel` / `topOfBook` surface as live `Pool`). See [docs/backtesting.md](../../docs/backtesting.md) for CLI usage and limitations.

```bash
npm run build -w @dreamdex-bot-kit/backtest
npm run test -w @dreamdex-bot-kit/backtest
```
