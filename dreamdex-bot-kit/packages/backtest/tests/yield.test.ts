/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

import { describe, expect, it } from "vitest";
import {
  WEIGHT_AT_ONE_SIGMA,
  describeYieldBand,
  proximityWeight,
  scoreIncrement,
  snapPriceToMinWeight,
  weightRadiusRaw,
} from "@dreamdex-bot-kit/core";

describe("proximityWeight", () => {
  const sigma = 1_000n;

  it("returns 1 at the mid", () => {
    expect(proximityWeight(5_000n, 5_000n, sigma)).toBeCloseTo(1, 12);
  });

  it("returns ≈ e^{-1/2} at one σ", () => {
    expect(proximityWeight(5_000n + sigma, 5_000n, sigma)).toBeCloseTo(WEIGHT_AT_ONE_SIGMA, 10);
    expect(proximityWeight(5_000n - sigma, 5_000n, sigma)).toBeCloseTo(WEIGHT_AT_ONE_SIGMA, 10);
  });

  it("returns ≈ e^{-2} at two σ", () => {
    expect(proximityWeight(5_000n + 2n * sigma, 5_000n, sigma)).toBeCloseTo(Math.exp(-2), 10);
  });

  it("returns 0 for non-positive σ", () => {
    expect(proximityWeight(1n, 1n, 0n)).toBe(0);
    expect(proximityWeight(1n, 1n, -1n)).toBe(0);
  });
});

describe("weightRadiusRaw", () => {
  it("equals σ for the one-σ weight floor", () => {
    const sigma = 42_000n;
    const r = weightRadiusRaw(sigma, WEIGHT_AT_ONE_SIGMA);
    expect(Number(r)).toBeCloseTo(Number(sigma), 0);
  });

  it("returns 0 at mid for minW=1", () => {
    expect(weightRadiusRaw(1000n, 1)).toBe(0n);
  });

  it("returns 0 for invalid inputs", () => {
    expect(weightRadiusRaw(0n, 0.5)).toBe(0n);
    expect(weightRadiusRaw(100n, 0)).toBe(0n);
    expect(weightRadiusRaw(100n, 1.5)).toBe(0n);
  });
});

describe("scoreIncrement", () => {
  it("scales qty × W × seconds", () => {
    expect(scoreIncrement(10, 0.5, 2)).toBeCloseTo(10, 12);
  });

  it("returns 0 for non-positive inputs", () => {
    expect(scoreIncrement(0, 1, 1)).toBe(0);
    expect(scoreIncrement(1, 0, 1)).toBe(0);
    expect(scoreIncrement(1, 1, 0)).toBe(0);
  });
});

describe("snapPriceToMinWeight", () => {
  const sigma = 100n;
  const tick = 1n;
  const mid = 1000n;
  const minW = WEIGHT_AT_ONE_SIGMA;

  it("leaves an already-eligible bid alone (tick-aligned)", () => {
    const bid = mid - 50n; // 0.5σ → W > 0.607
    expect(
      snapPriceToMinWeight({
        candidateRaw: bid,
        midRaw: mid,
        sigmaRaw: sigma,
        minWeight: minW,
        tickRaw: tick,
        isBid: true,
        oppositeRaw: mid + 10n,
      }),
    ).toBe(bid);
  });

  it("aligns off-tick candidates before / while snapping", () => {
    const tick10 = 10n;
    // Off-tick bid already inside the band — must round down to a tick multiple.
    const offTick = mid - 45n; // 955, not multiple of 10
    const snapped = snapPriceToMinWeight({
      candidateRaw: offTick,
      midRaw: mid,
      sigmaRaw: sigma,
      minWeight: minW,
      tickRaw: tick10,
      isBid: true,
      oppositeRaw: mid + 100n,
    });
    expect(snapped % tick10).toBe(0n);
    expect(proximityWeight(snapped, mid, sigma)).toBeGreaterThanOrEqual(minW - 1e-9);
  });

  it("snaps a far bid up toward mid", () => {
    const far = mid - 500n; // 5σ
    const snapped = snapPriceToMinWeight({
      candidateRaw: far,
      midRaw: mid,
      sigmaRaw: sigma,
      minWeight: minW,
      tickRaw: tick,
      isBid: true,
      oppositeRaw: mid + 200n,
    });
    expect(snapped).toBeGreaterThan(far);
    expect(snapped % tick).toBe(0n);
    expect(proximityWeight(snapped, mid, sigma)).toBeGreaterThanOrEqual(minW - 1e-9);
  });

  it("does not cross the opposite side", () => {
    const askTouch = mid + 1n;
    const snapped = snapPriceToMinWeight({
      candidateRaw: mid - 500n,
      midRaw: mid,
      sigmaRaw: sigma,
      minWeight: minW,
      tickRaw: tick,
      isBid: true,
      oppositeRaw: askTouch,
    });
    expect(snapped).toBeLessThan(askTouch);
  });
});

describe("describeYieldBand", () => {
  it("summarizes known weights", () => {
    const d = describeYieldBand(1000n);
    expect(d.weights.atMid).toBeCloseTo(1, 12);
    expect(d.weights.atOneSigma).toBeCloseTo(WEIGHT_AT_ONE_SIGMA, 10);
    expect(d.weights.atTwoSigma).toBeCloseTo(Math.exp(-2), 10);
  });
});
