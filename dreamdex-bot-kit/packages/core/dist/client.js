/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
// Chain clients. One place to build the viem public (read) and wallet (sign)
// clients for the active network from a private key. Don't construct clients
// elsewhere — pass this ChainContext around.
import { createPublicClient, createWalletClient, http, } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getNetwork, toViemChain } from "./config/networks.js";
export function createChainContext(privateKey) {
    const net = getNetwork();
    const key = privateKey ?? process.env.PRIVATE_KEY;
    if (!key)
        throw new Error("Set PRIVATE_KEY (env) or pass one to createChainContext().");
    const account = privateKeyToAccount(key.startsWith("0x") ? key : `0x${key}`);
    const chain = toViemChain(net);
    const publicClient = createPublicClient({ chain, transport: http(net.rpcUrl) });
    const walletClient = createWalletClient({ account, chain, transport: http(net.rpcUrl) });
    const ownerRaw = process.env.OWNER_ADDRESS;
    const owner = ownerRaw ? ownerRaw : undefined;
    return { net, account, publicClient, walletClient, owner };
}
//# sourceMappingURL=client.js.map