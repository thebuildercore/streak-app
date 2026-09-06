/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */

// Inventory seeding for SELL-side quoting. You can only sell an outcome you hold,
// and new YES/NO tokens come from minting a PAIR against collateral (mint-a-pair)
// — there is no naked short. This tops up collateral (faucet on testnet) then
// mints a YES/NO set so both book sides can be quoted.

import type { MarketOnchain, UnifiedMarket } from "@somnia-chain/markets-sdk";
import { assertTxOk, type EcContext } from "./exchange.js";
import { toRawUnits } from "./markets.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const log = (s: string) => console.log(`${new Date().toISOString()} ${s}`);

/**
 * Seed the signer's inventory for a market once: faucet collateral when low
 * (testnet only) + mint a YES/NO set. Pass the market's FRESH on-chain snapshot
 * (resolved by marketId) so the balance reads land on the same generation you
 * validated — v2 recycles a pool's `(nonce → ids)` each market.
 */
export async function seedInventory(ctx: EcContext, market: UnifiedMarket, onchain: MarketOnchain): Promise<void> {
  const { exchange, config } = ctx;
  const addr = exchange.walletAddress!;
  const one = 10n ** BigInt(config.decimals);
  const collateral = config.addresses.collateral ?? config.addresses.testUsdc;

  let collateralBal: bigint | null = null;
  if (collateral) {
    collateralBal = await exchange.client.getErc20Balance(collateral, addr);
    if (collateralBal < 1_000n * one && config.faucetEnabled) {
      await exchange.trader.faucet();
      await sleep(2_000);
      collateralBal = null; // stale after the mint
    }
  }

  // Outcome positions are ERC-6909 ids on the shared singleton — read YES by
  // (outcomeToken, yesId), not a per-market ERC-20 balanceOf.
  const yesBal = await exchange.client.getOutcomeBalance({ outcomeToken: onchain.outcomeToken, account: addr, id: onchain.yesId });
  const target = toRawUnits(config.inventory, config.decimals);
  if (yesBal >= target) return;

  // No faucet (mainnet): a short balance would revert the mint — warn + skip so
  // the loop keeps cycling while the operator tops the key up.
  if (!config.faucetEnabled && collateral) {
    const bal = collateralBal ?? (await exchange.client.getErc20Balance(collateral, addr));
    if (bal < target) {
      log(`WARN ${market.symbol} mint skipped: collateral ${bal} < ${target} (raw) — fund ${collateral} → ${addr}`);
      return;
    }
  }

  // NOTE the assertTxOk: the SDK resolves even when the tx REVERTED (it skips
  // simulation and never checks receipt.status) — e.g. minting on a market that
  // just left Trading. Without this the bot believes it holds inventory it doesn't.
  assertTxOk(await exchange.mintSet(market.symbol, config.inventory), `mintSet(${market.symbol})`);
  await sleep(2_000);
}
