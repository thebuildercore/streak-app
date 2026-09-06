/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { type PublicClient, type WalletClient, type Account } from "viem";
import { type NetworkConfig } from "./config/networks.js";
export interface ChainContext {
    net: NetworkConfig;
    account: Account;
    publicClient: PublicClient;
    walletClient: WalletClient;
    /**
     * Split-key / session-key mode. When set (via OWNER_ADDRESS), `account` is the
     * OPERATOR key and orders are placed on behalf of this owner via placeOrderFor.
     * The operator can never move funds. See docs/session-keys.md.
     */
    owner?: `0x${string}`;
}
export declare function createChainContext(privateKey?: string): ChainContext;
