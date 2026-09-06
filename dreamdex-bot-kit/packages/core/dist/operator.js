/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { SPOT_POOL_ABI, ERC20_ABI, OPERATOR_REGISTRY_ABI, OPERATOR_SELECTOR } from "./contract.js";
async function send(ctx, hash) {
    await ctx.publicClient.waitForTransactionReceipt({ hash });
    return hash;
}
/** Per pool: draw from / settle to the vault instead of the wallet (required for clean operator custody). */
export async function setManualVaultMode(ctx, pool, enabled) {
    return send(ctx, await ctx.walletClient.writeContract({ address: pool, abi: SPOT_POOL_ABI, functionName: "setManualVaultMode", args: [enabled], account: ctx.account, chain: ctx.walletClient.chain }));
}
/** Approve + deposit working capital into a pool's vault (the operator trades against this). */
export async function depositVault(ctx, pool, token, amountRaw) {
    const allowance = await ctx.publicClient.readContract({ address: token, abi: ERC20_ABI, functionName: "allowance", args: [ctx.account.address, pool] });
    if (allowance < amountRaw) {
        await send(ctx, await ctx.walletClient.writeContract({ address: token, abi: ERC20_ABI, functionName: "approve", args: [pool, amountRaw], account: ctx.account, chain: ctx.walletClient.chain }));
    }
    return send(ctx, await ctx.walletClient.writeContract({ address: pool, abi: SPOT_POOL_ABI, functionName: "deposit", args: [token, amountRaw], account: ctx.account, chain: ctx.walletClient.chain }));
}
export async function withdrawVault(ctx, pool, token, amountRaw) {
    return send(ctx, await ctx.walletClient.writeContract({ address: pool, abi: SPOT_POOL_ABI, functionName: "withdraw", args: [token, amountRaw], account: ctx.account, chain: ctx.walletClient.chain }));
}
/** Grant (or revoke) an operator for a single pool. Defaults to place + cancel. */
export async function grantOperator(ctx, pool, operator, selectors = [OPERATOR_SELECTOR.placeOrderFor, OPERATOR_SELECTOR.cancelOrderFor], approved = true) {
    return send(ctx, await ctx.walletClient.writeContract({
        address: ctx.net.operatorRegistry, abi: OPERATOR_REGISTRY_ABI, functionName: "setOperatorApprovalForPool",
        args: [pool, operator, selectors, approved], account: ctx.account, chain: ctx.walletClient.chain,
    }));
}
export function revokeOperator(ctx, pool, operator, selectors) {
    return grantOperator(ctx, pool, operator, selectors, false);
}
/** The exact yes/no the pool enforces inside placeOrderFor / cancelOrderFor. */
export async function isOperatorAuthorized(client, pool, owner, operator, selector) {
    return client.readContract({ address: pool, abi: SPOT_POOL_ABI, functionName: "isOperatorAuthorized", args: [owner, operator, selector] });
}
//# sourceMappingURL=operator.js.map