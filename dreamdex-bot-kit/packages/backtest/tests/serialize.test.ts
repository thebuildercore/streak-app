/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import { describe, expect, it } from "vitest";
import { serializeFill, serializeRunResult, jsonReplacer, toJsonSafe } from "../src/report/serialize.js";
import type { SimFill } from "../src/sim/fill-engine.js";
import type { BacktestRunResult } from "../src/replay/runner.js";

describe("serialize", () => {
  it("converts bigint orderId to string", () => {
    const fill: SimFill = {
      orderId: 12345678901234567890n,
      isBid: true,
      price: 1.5,
      qty: 2,
      fee: 0.01,
      timestamp: 1_700_000_000_000,
      role: "taker",
    };
    const s = serializeFill(fill);
    expect(s.orderId).toBe("12345678901234567890");
    expect(typeof s.orderId).toBe("string");
  });

  it("jsonReplacer handles bigint", () => {
    const raw = { id: 99n, nested: { x: 1n } };
    const json = JSON.stringify(raw, jsonReplacer);
    expect(json).toBe('{"id":"99","nested":{"x":"1"}}');
  });

  it("serializeRunResult maps fills", () => {
    const result = {
      botId: "momentum",
      metrics: {
        totalPnl: 1,
        totalPnlPct: 0.01,
        realizedPnl: 1,
        feesPaid: 0,
        trades: 1,
        winRate: null,
        maxDrawdown: 0,
        maxDrawdownPct: 0,
        sharpe: null,
        finalEquity: 1001,
        finalBase: 0,
        finalQuote: 1001,
        avgMarkoutBps: null,
        markoutSampleSize: 0,
      },
      warnings: [],
      candlesUsed: 10,
      fills: [
        {
          orderId: 42n,
          isBid: false,
          price: 10,
          qty: 1,
          fee: 0,
          timestamp: 100,
          role: "maker",
          markoutBps: -12.5,
          markoutBars: 5,
          queueAheadQty: 0,
          partial: false,
        },
      ],
    } as BacktestRunResult;
    const s = serializeRunResult(result);
    expect(s.fills?.[0]?.orderId).toBe("42");
    expect(s.fills?.[0]?.markoutBps).toBe(-12.5);
    expect(s.fills?.[0]?.markoutBars).toBe(5);
    expect(s.fills?.[0]?.queueAheadQty).toBe(0);
    expect(s.fills?.[0]?.partial).toBe(false);
    expect(() => JSON.stringify(s)).not.toThrow();
  });

  it("toJsonSafe deep-converts bigints", () => {
    expect(toJsonSafe({ a: 1n })).toEqual({ a: "1" });
  });
});
