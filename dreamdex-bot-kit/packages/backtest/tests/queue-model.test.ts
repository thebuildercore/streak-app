/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import { describe, expect, it } from "vitest";
import { syntheticQuantityAtPrice } from "../src/book/synthetic.js";
import { depthAheadAt } from "../src/book/hybrid.js";
import { latestSnapshotAtOrBefore } from "../src/book/depth-overlay.js";
import type { DepthSnapshot } from "../src/book/depth-overlay.js";
import { volumeThroughPriceSynthetic, buildQueueContext } from "../src/sim/queue-model.js";
import type { Candle } from "../src/candles/types.js";

const c = (low: number, high: number, volume: number, close = (low + high) / 2): Candle => ({
  timestamp: 1_000,
  open: String(close),
  high: String(high),
  low: String(low),
  close: String(close),
  volume: String(volume),
});

describe("volumeThroughPriceSynthetic", () => {
  it("returns full volume on flat bar", () => {
    expect(volumeThroughPriceSynthetic(c(100, 100, 50), 100, true, 0.01)).toBe(50);
  });

  it("gives inclusive fraction at endpoints and midpoint for bids", () => {
    // low=100, high=101, tick=0.5 → buckets 100, 100.5, 101 (3 buckets)
    const candle = c(100, 101, 30);
    const tick = 0.5;
    // bid at low: 1/3 of volume
    expect(volumeThroughPriceSynthetic(candle, 100, true, tick)).toBeCloseTo(10, 10);
    // bid at mid: 2/3
    expect(volumeThroughPriceSynthetic(candle, 100.5, true, tick)).toBeCloseTo(20, 10);
    // bid at high: all
    expect(volumeThroughPriceSynthetic(candle, 101, true, tick)).toBeCloseTo(30, 10);
  });

  it("mirrors ask-side inclusive fraction", () => {
    const candle = c(100, 101, 30);
    const tick = 0.5;
    expect(volumeThroughPriceSynthetic(candle, 101, false, tick)).toBeCloseTo(10, 10);
    expect(volumeThroughPriceSynthetic(candle, 100.5, false, tick)).toBeCloseTo(20, 10);
    expect(volumeThroughPriceSynthetic(candle, 100, false, tick)).toBeCloseTo(30, 10);
  });
});

describe("syntheticQuantityAtPrice / depthAheadAt", () => {
  it("decays monotonically away from touch", () => {
    const candle = c(99, 101, 100, 100);
    const tick = 0.01;
    const atTouch = syntheticQuantityAtPrice(candle, true, 99.95, tick, {
      spreadBps: 10,
      depthBaseFrac: 0.05,
      depthDecay: 0.7,
    });
    expect(atTouch).toBeCloseTo(5, 8); // 100 * 0.05

    const oneTick = syntheticQuantityAtPrice(candle, true, 99.94, tick, {
      spreadBps: 10,
      depthBaseFrac: 0.05,
      depthDecay: 0.7,
    });
    expect(oneTick).toBeCloseTo(5 * 0.7, 8);
    expect(oneTick).toBeLessThan(atTouch);
  });

  it("prefers causal recorded snapshot over synthetic", () => {
    const candle = c(99, 101, 100, 100);
    const snapshots = new Map<number, DepthSnapshot>([
      [
        900,
        {
          timestamp: 900,
          bids: [{ price: 98, quantity: 42 }],
          asks: [{ price: 102, quantity: 7 }],
        },
      ],
      // future snapshot must be ignored
      [
        1_100,
        {
          timestamp: 1_100,
          bids: [{ price: 98, quantity: 999 }],
          asks: [{ price: 102, quantity: 999 }],
        },
      ],
    ]);
    const qty = depthAheadAt(candle, true, 98, 0.01, {
      snapshots,
      snapshotToleranceMs: 60_000,
      depthBaseFrac: 0.05,
    });
    expect(qty).toBe(42);
  });

  it("latestSnapshotAtOrBefore rejects future snapshots", () => {
    const snapshots = new Map<number, DepthSnapshot>([
      [1_100, { timestamp: 1_100, bids: [{ price: 1, quantity: 1 }], asks: [] }],
      [900, { timestamp: 900, bids: [{ price: 2, quantity: 2 }], asks: [] }],
    ]);
    const snap = latestSnapshotAtOrBefore(snapshots, 1_000, 60_000);
    expect(snap?.timestamp).toBe(900);
  });
});

describe("buildQueueContext", () => {
  it("uses synthetic volume from candle", () => {
    const candle = c(100, 101, 30);
    const q = buildQueueContext(candle, { tick: 0.5, spreadBps: 10, depthBaseFrac: 0.05 });
    expect(q.volumeThroughPrice(100, true)).toBeCloseTo(10, 10);
  });
});
