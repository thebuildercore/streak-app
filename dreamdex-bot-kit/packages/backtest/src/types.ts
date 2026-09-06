/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import type { SimPool } from "./sim/sim-pool.js";

export type LogFn = (msg: string, extra?: unknown) => void;

export interface BotHandle {
  onBar(): Promise<void>;
  finish?(): Promise<void>;
  warmupBars?: number;
  /** Optional extras merged into BacktestMetrics after the run (e.g. estYieldScore). */
  metricsExtras?: () => Partial<{ estYieldScore: number }>;
}

/** Factory that wires a strategy to a SimPool for one backtest run. */
export type BotFactory = (pool: SimPool, log: LogFn) => Promise<BotHandle> | BotHandle;
