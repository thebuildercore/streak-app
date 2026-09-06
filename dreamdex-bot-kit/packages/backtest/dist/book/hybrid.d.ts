/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { TopOfBook } from "@dreamdex-bot-kit/core";
import type { Candle } from "../candles/types.js";
import { type SyntheticBookOptions, type SyntheticDepthOptions } from "./synthetic.js";
import { type DepthSnapshot } from "./depth-overlay.js";
export interface HybridBookOptions extends SyntheticBookOptions {
    snapshots?: Map<number, DepthSnapshot>;
    snapshotToleranceMs?: number;
    /** When set, override synthetic spread for the whole run (e.g. from live calibration). */
    calibratedSpreadBps?: number;
}
/** Prefer recorded depth when available; otherwise synthetic mid ± spread. */
export declare function hybridTopOfBook(candle: Candle, opts?: HybridBookOptions): TopOfBook;
/**
 * Ambient resting quantity at `price` for queue-position estimates.
 * Prefers a causal recorded snapshot level; falls back to synthetic depth.
 */
export declare function depthAheadAt(candle: Candle, isBid: boolean, price: number, tick: number, opts?: HybridBookOptions & SyntheticDepthOptions): number;
//# sourceMappingURL=hybrid.d.ts.map