/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// Venue scoping in `activeMarkets`. These run against an in-memory market
// registry so the multi-venue path is exercised deterministically, whatever
// the live testnet happens to be running (see issue #22).
import { describe, expect, it } from "vitest";
import { activeMarkets, type VenueScope } from "../src/markets.js";
import type { EcContext } from "../src/exchange.js";

const VENUE_A = "0x1a1e6821cde7d0159c0d293177871e09677b4e42307c7db3ba94f8648a5a050f";
const VENUE_B = "0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c";

function binary(symbol: string, venueId: string, operatorId: number) {
  return { symbol, type: "binary", active: true, info: { marketType: "BINARY", venueId, operatorId } };
}

function ctxWith(
  markets: Record<string, unknown>,
  config: Partial<{ venueId: string; operatorId: number }> = {},
): EcContext {
  return {
    config: { venueId: config.venueId, operatorId: config.operatorId },
    exchange: { loadMarkets: async () => markets },
  } as unknown as EcContext;
}

const TWO_VENUES = {
  a1: binary("BTC-A/tUSDC", VENUE_A, 4),
  a2: binary("ETH-A/tUSDC", VENUE_A, 4),
  b1: binary("BTC-B/tUSDC", VENUE_B, 2),
};

describe("activeMarkets venue scoping", () => {
  it("throws when live markets span several venues and nothing scopes them", async () => {
    await expect(activeMarkets(ctxWith(TWO_VENUES))).rejects.toThrow(/Live markets span 2 venues/);
  });

  it("honours opts.scope, so an inferred venue can be kept for the rest of a run", async () => {
    // The shape resolveVenue infers: both ids of the first live market.
    const scope: VenueScope = { venueId: VENUE_A, operatorId: 4 };
    const rows = await activeMarkets(ctxWith(TWO_VENUES), { scope });
    expect(rows.map((m) => m.symbol).sort()).toEqual(["BTC-A/tUSDC", "ETH-A/tUSDC"]);
  });

  it("still scopes from .env when no opts.scope is given", async () => {
    const rows = await activeMarkets(ctxWith(TWO_VENUES, { venueId: VENUE_B }));
    expect(rows.map((m) => m.symbol)).toEqual(["BTC-B/tUSDC"]);
  });

  it("treats an empty opts.scope as unscoped, the resolveVenue 'none' case", async () => {
    await expect(activeMarkets(ctxWith(TWO_VENUES), { scope: {} })).rejects.toThrow(
      /Live markets span 2 venues/,
    );
  });
});
