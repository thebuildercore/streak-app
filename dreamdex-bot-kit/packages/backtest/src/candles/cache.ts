/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Candle, CandleInterval } from "./types.js";

export interface CandleCacheOptions {
  /** Directory for cache files. Default: `.cache/candles` under cwd. */
  dir?: string;
  /** When true, skip reading/writing the cache. */
  disabled?: boolean;
}

function cacheDir(opts: CandleCacheOptions = {}): string {
  return opts.dir ?? path.join(process.cwd(), ".cache", "candles");
}

function cacheKey(
  symbol: string,
  interval: CandleInterval,
  sinceMs: number,
  untilMs: number,
  network: string,
): string {
  const raw = `${network}|${symbol}|${interval}|${sinceMs}|${untilMs}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 24);
}

function cachePath(
  symbol: string,
  interval: CandleInterval,
  sinceMs: number,
  untilMs: number,
  network: string,
  opts: CandleCacheOptions = {},
): string {
  const key = cacheKey(symbol, interval, sinceMs, untilMs, network);
  const safeSymbol = symbol.replace(/[^a-zA-Z0-9:_-]/g, "_");
  return path.join(cacheDir(opts), `${safeSymbol}_${interval}_${key}.json`);
}

export function readCandleCache(
  symbol: string,
  interval: CandleInterval,
  sinceMs: number,
  untilMs: number,
  network: string,
  opts: CandleCacheOptions = {},
): Candle[] | null {
  if (opts.disabled) return null;
  const file = cachePath(symbol, interval, sinceMs, untilMs, network, opts);
  if (!existsSync(file)) return null;
  try {
    const raw = readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as { candles?: Candle[] };
    return Array.isArray(parsed.candles) ? parsed.candles : null;
  } catch {
    return null;
  }
}

export function writeCandleCache(
  symbol: string,
  interval: CandleInterval,
  sinceMs: number,
  untilMs: number,
  network: string,
  candles: Candle[],
  opts: CandleCacheOptions = {},
): void {
  if (opts.disabled) return;
  const dir = cacheDir(opts);
  mkdirSync(dir, { recursive: true });
  const file = cachePath(symbol, interval, sinceMs, untilMs, network, opts);
  writeFileSync(
    file,
    JSON.stringify({
      symbol,
      interval,
      sinceMs,
      untilMs,
      network,
      candles,
    }),
    "utf8",
  );
}
