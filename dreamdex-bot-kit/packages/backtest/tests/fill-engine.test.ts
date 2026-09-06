/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import { describe, expect, it } from "vitest";
import { FillEngine, type QueueFillContext } from "../src/sim/fill-engine.js";
import { ORDER_TYPE } from "@dreamdex-bot-kit/core";
import type { Candle } from "../src/candles/types.js";

const candle = (
  ts: number,
  o: number,
  h: number,
  l: number,
  c: number,
  volume = "100",
): Candle => ({
  timestamp: ts,
  open: String(o),
  high: String(h),
  low: String(l),
  close: String(c),
  volume,
});

function ctx(opts: {
  depth?: number;
  volume?: number | ((price: number, isBid: boolean) => number);
}): QueueFillContext {
  return {
    depthAheadAt: () => opts.depth ?? 0,
    volumeThroughPrice:
      typeof opts.volume === "function"
        ? opts.volume
        : () => opts.volume ?? 0,
  };
}

describe("FillEngine", () => {
  it("fills IOC buy when limit crosses ask", () => {
    const eng = new FillEngine();
    const book = { bestBid: 99, bestAsk: 101, mid: 100 };
    const r = eng.place(
      { isBid: true, price: 102, qty: 1, orderType: ORDER_TYPE.ImmediateOrCancel },
      book,
      candle(1, 100, 102, 99, 101),
    );
    expect(r.rejected).toBeUndefined();
    expect(r.fills).toHaveLength(1);
    expect(r.fills[0]!.price).toBe(101);
    expect(r.fills[0]!.qty).toBe(1);
  });

  it("does not fill IOC buy below ask", () => {
    const eng = new FillEngine();
    const book = { bestBid: 99, bestAsk: 101, mid: 100 };
    const r = eng.place(
      { isBid: true, price: 100, qty: 1, orderType: ORDER_TYPE.ImmediateOrCancel },
      book,
      candle(1, 100, 102, 99, 101),
    );
    expect(r.fills).toHaveLength(0);
  });

  it("rejects PostOnly that would cross", () => {
    const eng = new FillEngine();
    const book = { bestBid: 99, bestAsk: 101, mid: 100 };
    const r = eng.place(
      { isBid: true, price: 101, qty: 1, orderType: ORDER_TYPE.PostOnly },
      book,
      candle(1, 100, 102, 99, 101),
    );
    expect(r.rejected).toMatch(/cross/);
  });

  it("fills resting PostOnly bid when bar low trades through", () => {
    const eng = new FillEngine();
    const book = { bestBid: 99, bestAsk: 101, mid: 100 };
    const place = eng.place(
      { isBid: true, price: 98, qty: 2, orderType: ORDER_TYPE.PostOnly },
      book,
      candle(1, 100, 101, 99, 100),
    );
    expect(place.fills).toHaveLength(0);
    expect(eng.resting.size).toBe(1);

    const fills = eng.matchRestingAgainstBar(candle(2, 99, 100, 97, 98));
    expect(fills).toHaveLength(1);
    expect(fills[0]!.qty).toBe(2);
    expect(fills[0]!.role).toBe("maker");
  });
});

describe("FillEngine queue position", () => {
  const book = { bestBid: 99, bestAsk: 101, mid: 100 };

  it("does not fill while volume stays below queueAheadQty", () => {
    const eng = new FillEngine();
    eng.place(
      { isBid: true, price: 98, qty: 2, orderType: ORDER_TYPE.PostOnly },
      book,
      candle(1, 100, 101, 99, 100),
      ctx({ depth: 10, volume: 3 }),
    );
    expect(eng.resting.size).toBe(1);

    for (let i = 0; i < 3; i++) {
      const fills = eng.matchRestingAgainstBar(candle(2 + i, 99, 100, 97, 98), ctx({ depth: 10, volume: 3 }));
      expect(fills).toHaveLength(0);
      expect(eng.resting.size).toBe(1);
    }
  });

  it("fills partially once queue-ahead is partly consumed", () => {
    const eng = new FillEngine({ makerFeeBps: 10 });
    eng.place(
      { isBid: true, price: 98, qty: 5, orderType: ORDER_TYPE.PostOnly },
      book,
      candle(1, 100, 101, 99, 100),
      ctx({ depth: 4, volume: 0 }),
    );
    const resting = [...eng.resting.values()][0]!;
    expect(resting.queueAheadQty).toBe(4);

    // traded 6 → clears 4 ahead + fills 2
    const fills = eng.matchRestingAgainstBar(candle(2, 99, 100, 97, 98), ctx({ depth: 4, volume: 6 }));
    expect(fills).toHaveLength(1);
    expect(fills[0]!.qty).toBeCloseTo(2, 10);
    expect(fills[0]!.partial).toBe(true);
    expect(fills[0]!.queueAheadQty).toBe(4);
    expect(fills[0]!.fee).toBeCloseTo((98 * 2 * 10) / 10_000, 10);
    expect(eng.resting.size).toBe(1);
    const left = [...eng.resting.values()][0]!;
    expect(left.qty).toBeCloseTo(3, 10);
    expect(left.queueAheadQty).toBe(0);
  });

  it("fully fills across multiple bars once cumulative volume covers ahead + qty", () => {
    const eng = new FillEngine();
    eng.place(
      { isBid: true, price: 98, qty: 5, orderType: ORDER_TYPE.PostOnly },
      book,
      candle(1, 100, 101, 99, 100),
      ctx({ depth: 3, volume: 0 }),
    );

    const f1 = eng.matchRestingAgainstBar(candle(2, 99, 100, 97, 98), ctx({ volume: 4 }));
    expect(f1).toHaveLength(1);
    expect(f1[0]!.qty).toBeCloseTo(1, 10);

    const f2 = eng.matchRestingAgainstBar(candle(3, 99, 100, 97, 98), ctx({ volume: 2 }));
    expect(f2).toHaveLength(1);
    expect(f2[0]!.qty).toBeCloseTo(2, 10);

    const f3 = eng.matchRestingAgainstBar(candle(4, 99, 100, 97, 98), ctx({ volume: 10 }));
    expect(f3).toHaveLength(1);
    expect(f3[0]!.qty).toBeCloseTo(2, 10);
    expect(eng.resting.size).toBe(0);

    const total = [...f1, ...f2, ...f3].reduce((s, f) => s + f.qty, 0);
    expect(total).toBeCloseTo(5, 10);
  });

  it("second same-price order waits for first (FIFO)", () => {
    const eng = new FillEngine();
    eng.place(
      { isBid: true, price: 98, qty: 3, orderType: ORDER_TYPE.PostOnly },
      book,
      candle(1, 100, 101, 99, 100),
      ctx({ depth: 0, volume: 0 }),
    );
    eng.place(
      { isBid: true, price: 98, qty: 4, orderType: ORDER_TYPE.PostOnly },
      book,
      candle(1, 100, 101, 99, 100),
      ctx({ depth: 0, volume: 0 }),
    );
    const orders = [...eng.resting.values()];
    expect(orders[0]!.queueAheadQty).toBe(0);
    expect(orders[1]!.queueAheadQty).toBe(3);

    const fills = eng.matchRestingAgainstBar(candle(2, 99, 100, 97, 98), ctx({ volume: 5 }));
    expect(fills).toHaveLength(2);
    expect(fills[0]!.qty).toBeCloseTo(3, 10);
    expect(fills[1]!.qty).toBeCloseTo(2, 10);
    expect(eng.resting.size).toBe(1);
    expect([...eng.resting.values()][0]!.qty).toBeCloseTo(2, 10);
  });

  it("cancel adjusts later same-price queue-ahead", () => {
    const eng = new FillEngine();
    const a = eng.place(
      { isBid: true, price: 98, qty: 3, orderType: ORDER_TYPE.PostOnly },
      book,
      candle(1, 100, 101, 99, 100),
      ctx({ depth: 0 }),
    );
    eng.place(
      { isBid: true, price: 98, qty: 4, orderType: ORDER_TYPE.PostOnly },
      book,
      candle(1, 100, 101, 99, 100),
      ctx({ depth: 0 }),
    );
    expect([...eng.resting.values()][1]!.queueAheadQty).toBe(3);
    eng.cancel(a.orderId);
    expect([...eng.resting.values()][0]!.queueAheadQty).toBe(0);

    const fills = eng.matchRestingAgainstBar(candle(2, 99, 100, 97, 98), ctx({ volume: 2 }));
    expect(fills).toHaveLength(1);
    expect(fills[0]!.qty).toBeCloseTo(2, 10);
  });

  it("queue mode does not rematch Normal/GTC on the placement bar", () => {
    const eng = new FillEngine();
    const r = eng.place(
      { isBid: true, price: 98, qty: 2, orderType: ORDER_TYPE.Normal },
      book,
      candle(1, 100, 101, 97, 100), // low already through 98
      ctx({ depth: 0, volume: 100 }),
    );
    expect(r.fills.filter((f) => f.role === "maker")).toHaveLength(0);
    expect(eng.resting.size).toBe(1);

    const next = eng.matchRestingAgainstBar(candle(2, 99, 100, 97, 98), ctx({ depth: 0, volume: 100 }));
    expect(next).toHaveLength(1);
    expect(next[0]!.role).toBe("maker");
  });

  it("explicit undefined queueCtx matches legacy no-arg behavior", () => {
    const engA = new FillEngine();
    const engB = new FillEngine();
    for (const eng of [engA, engB]) {
      eng.place(
        { isBid: true, price: 98, qty: 2, orderType: ORDER_TYPE.PostOnly },
        book,
        candle(1, 100, 101, 99, 100),
      );
    }
    const legacy = engA.matchRestingAgainstBar(candle(2, 99, 100, 97, 98));
    const explicit = engB.matchRestingAgainstBar(candle(2, 99, 100, 97, 98), undefined);
    expect(explicit).toEqual(legacy);
  });
});
