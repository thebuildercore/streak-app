/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

/** OHLCV candle from GET /v0/markets/{symbol}/candles */
export interface Candle {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export const INTERVAL_MS: Record<CandleInterval, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1d": 86_400_000,
};

export function parseCandleNums(c: Candle): {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
} {
  return {
    timestamp: c.timestamp,
    open: Number(c.open),
    high: Number(c.high),
    low: Number(c.low),
    close: Number(c.close),
    volume: Number(c.volume),
  };
}
