/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import { describe, expect, it } from "vitest";
import { syntheticTopOfBook } from "../src/book/synthetic.js";

describe("syntheticTopOfBook", () => {
  it("builds mid from close and spread from bps", () => {
    const tob = syntheticTopOfBook(
      { timestamp: 1, open: "100", high: "105", low: "95", close: "100", volume: "1" },
      { spreadBps: 10 },
    );
    expect(tob.mid).toBe(100);
    // half spread = 100 * 10/2/10000 = 0.05
    expect(tob.bestBid).toBeCloseTo(99.95, 8);
    expect(tob.bestAsk).toBeCloseTo(100.05, 8);
  });

  it("supports hl2 mid mode", () => {
    const tob = syntheticTopOfBook(
      { timestamp: 1, open: "100", high: "110", low: "90", close: "100", volume: "1" },
      { midMode: "hl2", spreadBps: 0 },
    );
    expect(tob.mid).toBe(100);
    expect(tob.bestBid).toBe(100);
    expect(tob.bestAsk).toBe(100);
  });
});
