/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { PublicClient } from "viem";
import type { ChainContext } from "./client.js";
type Selector = `0x${string}`;
/** Per pool: draw from / settle to the vault instead of the wallet (required for clean operator custody). */
export declare function setManualVaultMode(ctx: ChainContext, pool: `0x${string}`, enabled: boolean): Promise<`0x${string}`>;
/** Approve + deposit working capital into a pool's vault (the operator trades against this). */
export declare function depositVault(ctx: ChainContext, pool: `0x${string}`, token: `0x${string}`, amountRaw: bigint): Promise<`0x${string}`>;
export declare function withdrawVault(ctx: ChainContext, pool: `0x${string}`, token: `0x${string}`, amountRaw: bigint): Promise<`0x${string}`>;
/** Grant (or revoke) an operator for a single pool. Defaults to place + cancel. */
export declare function grantOperator(ctx: ChainContext, pool: `0x${string}`, operator: `0x${string}`, selectors?: readonly Selector[], approved?: boolean): Promise<`0x${string}`>;
export declare function revokeOperator(ctx: ChainContext, pool: `0x${string}`, operator: `0x${string}`, selectors?: readonly Selector[]): Promise<`0x${string}`>;
/** The exact yes/no the pool enforces inside placeOrderFor / cancelOrderFor. */
export declare function isOperatorAuthorized(client: PublicClient, pool: `0x${string}`, owner: `0x${string}`, operator: `0x${string}`, selector: Selector): Promise<boolean>;
export {};
