/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// What the bot holds, and what of that is actually at risk.
//
// The distinction this file exists for: YES and NO are not interchangeable risk.
// Equal amounts of both form a COMPLETE SET, which redeems for one collateral
// per set whichever way the market resolves — no directional exposure at all.
// Only the IMBALANCE between the legs is a bet.
//
// So gross shares bought is the wrong number to run risk limits on. It reads the
// same for a market holding 5 YES as for one holding 3 YES and 2 NO, when the
// first is five shares of risk and the second is one. A bot limiting on gross
// stops trading a position it has largely neutralised by accident, and the
// offsetting part is capital locked up until expiry earning nothing.

/** Holdings in one market, split by leg. */
export interface Held {
  yes: number;
  no: number;
}

export type Leg = "yes" | "no";

/** Directional shares at risk — the legs cancel, only the imbalance is a bet. */
export const netOf = (h: Held): number => Math.abs(h.yes - h.no);

/** Every share held, offsetting or not. Only useful next to `netOf`. */
export const grossOf = (h: Held): number => h.yes + h.no;

/** Complete sets: the riskless, redeem-for-one part of the holding. */
export const setsOf = (h: Held): number => Math.min(h.yes, h.no);

/**
 * Per-market holdings, keyed by market SYMBOL — never by pool address, which v2
 * recycles across successive markets.
 */
export class Positions {
  private readonly held = new Map<string, Held>();

  in(symbol: string): Held {
    return this.held.get(symbol) ?? { yes: 0, no: 0 };
  }

  /** Shares of `leg` held opposite to the one being considered. */
  opposing(symbol: string, leg: Leg): number {
    const h = this.in(symbol);
    return leg === "yes" ? h.no : h.yes;
  }

  add(symbol: string, leg: Leg, shares: number): void {
    if (!(shares > 0)) return;
    const h = this.in(symbol);
    this.held.set(symbol, {
      yes: h.yes + (leg === "yes" ? shares : 0),
      no: h.no + (leg === "no" ? shares : 0),
    });
  }

  /** Forget a market — call when it stops trading and the position settles. */
  clear(symbol: string): void {
    this.held.delete(symbol);
  }

  net(symbol: string): number {
    return netOf(this.in(symbol));
  }

  /** Directional shares across every market — what MAX_EXPOSURE limits. */
  totalNet(): number {
    let n = 0;
    for (const h of this.held.values()) n += netOf(h);
    return n;
  }

  totalGross(): number {
    let n = 0;
    for (const h of this.held.values()) n += grossOf(h);
    return n;
  }
}
