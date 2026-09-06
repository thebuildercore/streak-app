/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import { describe, expect, it } from "vitest";
import { computeMarkouts } from "../src/report/markout.js";
import { computeMetrics } from "../src/report/metrics.js";
import { PortfolioLedger } from "../src/sim/ledger.js";
import type { SimFill } from "../src/sim/fill-engine.js";
import type { Candle } from "../src/candles/types.js";

function candles(closes: number[], startTs = 1_000, step = 60_000): Candle[] {
  return closes.map((close, i) => ({
    timestamp: startTs + i * step,
    open: String(close),
    high: String(close + 1),
    low: String(close - 1),
    close: String(close),
    volume: "10",
  }));
}

function maker(partial: Partial<SimFill> & Pick<SimFill, "isBid" | "price" | "timestamp">): SimFill {
  return {
    orderId: 1n,
    qty: 1,
    fee: 0,
    role: "maker",
    ...partial,
  };
}

describe("computeMarkouts", () => {
  it("uses conventional PnL sign for bids and asks", () => {
    const series = candles([100, 100, 100, 100, 100, 110]); // +5 bars → 110
    const fills: SimFill[] = [
      maker({ isBid: true, price: 100, timestamp: 1_000, orderId: 1n }),
      maker({ isBid: false, price: 100, timestamp: 1_000, orderId: 2n }),
    ];
    computeMarkouts(fills, series, { bars: 5, intervalMs: 60_000, bookOpts: { spreadBps: 0 } });
    // Bid + rising mid ⇒ favorable ⇒ positive
    expect(fills[0]!.markoutBps).toBeCloseTo(1_000, 6);
    // Ask + rising mid ⇒ adverse ⇒ negative
    expect(fills[1]!.markoutBps).toBeCloseTo(-1_000, 6);
    expect(fills[0]!.markoutBars).toBe(5);
  });

  it("bid with falling mid is adverse (negative)", () => {
    const series = candles([100, 100, 100, 100, 100, 90]);
    const fills: SimFill[] = [maker({ isBid: true, price: 100, timestamp: 1_000 })];
    computeMarkouts(fills, series, { bars: 5, intervalMs: 60_000, bookOpts: { spreadBps: 0 } });
    expect(fills[0]!.markoutBps).toBeCloseTo(-1_000, 6);
  });

  it("leaves fills near end undefined when target candle missing", () => {
    const series = candles([100, 101, 102]);
    const fills: SimFill[] = [maker({ isBid: true, price: 100, timestamp: series[1]!.timestamp })];
    computeMarkouts(fills, series, { bars: 5, intervalMs: 60_000, bookOpts: { spreadBps: 0 } });
    expect(fills[0]!.markoutBps).toBeUndefined();
  });

  it("never touches taker fills", () => {
    const series = candles([100, 100, 100, 100, 100, 110]);
    const fills: SimFill[] = [
      {
        orderId: 1n,
        isBid: true,
        price: 100,
        qty: 1,
        fee: 0,
        timestamp: 1_000,
        role: "taker",
      },
    ];
    computeMarkouts(fills, series, { bars: 5, intervalMs: 60_000, bookOpts: { spreadBps: 0 } });
    expect(fills[0]!.markoutBps).toBeUndefined();
  });

  it("bars = 0 is a no-op", () => {
    const series = candles([100, 110]);
    const fills: SimFill[] = [maker({ isBid: true, price: 100, timestamp: 1_000 })];
    computeMarkouts(fills, series, { bars: 0, intervalMs: 60_000, bookOpts: { spreadBps: 0 } });
    expect(fills[0]!.markoutBps).toBeUndefined();
  });

  it("resolves by exact elapsed interval, not array index", () => {
    // Gap: missing the 4th bar between index 3 and 4
    const series: Candle[] = [
      ...candles([100, 100, 100], 1_000, 60_000),
      // skip 1_000 + 3*60_000
      {
        timestamp: 1_000 + 5 * 60_000,
        open: "120",
        high: "121",
        low: "119",
        close: "120",
        volume: "1",
      },
    ];
    const fills: SimFill[] = [maker({ isBid: true, price: 100, timestamp: 1_000 })];
    // bars=5 → target 1_000+5*60k which exists → 120
    computeMarkouts(fills, series, { bars: 5, intervalMs: 60_000, bookOpts: { spreadBps: 0 } });
    expect(fills[0]!.markoutBps).toBeCloseTo(2_000, 6);

    // bars=3 → target missing → undefined (index+3 would wrongly hit last candle)
    const fills2: SimFill[] = [maker({ isBid: true, price: 100, timestamp: 1_000 })];
    computeMarkouts(fills2, series, { bars: 3, intervalMs: 60_000, bookOpts: { spreadBps: 0 } });
    expect(fills2[0]!.markoutBps).toBeUndefined();
  });
});

describe("computeMetrics markout aggregation", () => {
  it("notional-weights avgMarkoutBps", () => {
    const ledger = new PortfolioLedger(1000, 0);
    ledger.fills.push(
      {
        orderId: 1n,
        isBid: true,
        price: 100,
        qty: 1,
        fee: 0,
        timestamp: 1,
        role: "maker",
        markoutBps: 100,
      },
      {
        orderId: 2n,
        isBid: true,
        price: 100,
        qty: 9,
        fee: 0,
        timestamp: 1,
        role: "maker",
        markoutBps: -100,
      },
    );
    const m = computeMetrics({
      initialEquity: 1000,
      finalEquity: 1000,
      ledger,
      equityCurve: [],
      lastMid: 100,
    });
    // (100*100 + 900*(-100)) / 1000 = -80
    expect(m.avgMarkoutBps).toBeCloseTo(-80, 8);
    expect(m.markoutSampleSize).toBe(2);
  });
});
