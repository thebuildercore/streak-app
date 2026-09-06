/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import { MARKETS, NATIVE_SENTINEL } from "./config/tokens.js";
import { SPOT_POOL_ABI, ERC20_ABI, readPoolParams, readBookLevels, readWithdrawableBalance, } from "./contract.js";
import { placeOrder, cancelOrder, placeOrderFor, cancelOrderFor } from "./execute.js";
import { ORDER_TYPE, buildExpireNs } from "./gotchas.js";
import { toRaw, fromRaw, alignToTick, alignToLot } from "./quant.js";
export class Pool {
    ctx;
    symbol;
    address;
    baseIsNative;
    params;
    baseDecimals;
    quoteDecimals;
    constructor(ctx, symbol, address, baseIsNative, params, baseDecimals, quoteDecimals) {
        this.ctx = ctx;
        this.symbol = symbol;
        this.address = address;
        this.baseIsNative = baseIsNative;
        this.params = params;
        this.baseDecimals = baseDecimals;
        this.quoteDecimals = quoteDecimals;
    }
    static async load(ctx, symbol) {
        const meta = MARKETS[ctx.net.name][symbol];
        if (!meta)
            throw new Error(`Unknown market "${symbol}" on ${ctx.net.name}. See packages/core/src/config/tokens.ts.`);
        const params = await readPoolParams(ctx.publicClient, meta.pool);
        return new Pool(ctx, symbol, meta.pool, meta.baseIsNative, params, meta.baseDecimals, meta.quoteDecimals);
    }
    get exec() {
        return { publicClient: this.ctx.publicClient, walletClient: this.ctx.walletClient, account: this.ctx.account };
    }
    /**
     * The account whose position we're reading. In session-key mode the signer is
     * the OPERATOR, but orders are placed for — and fills settle to — the OWNER, so
     * balance/order reads must be scoped to the owner, mirroring how `place()` /
     * `cancel()` route through the `*For` variants. With no owner set this is the
     * signer, so the default (non-session-key) path is unchanged.
     */
    get subject() {
        return this.ctx.owner ?? this.ctx.account.address;
    }
    /** Human-unit tick / lot / min for sizing decisions. */
    get tick() { return fromRaw(this.params.tickSize, this.quoteDecimals); }
    get lot() { return fromRaw(this.params.lotSize, this.baseDecimals); }
    get minQty() { return fromRaw(this.params.minQuantity, this.baseDecimals); }
    async topOfBook(depth = 1) {
        const [bids, asks] = await Promise.all([
            readBookLevels(this.ctx.publicClient, this.address, true, depth),
            readBookLevels(this.ctx.publicClient, this.address, false, depth),
        ]);
        const bestBid = bids[0] ? fromRaw(bids[0].priceRaw, this.quoteDecimals) : undefined;
        const bestAsk = asks[0] ? fromRaw(asks[0].priceRaw, this.quoteDecimals) : undefined;
        const mid = bestBid !== undefined && bestAsk !== undefined ? (bestBid + bestAsk) / 2 : (bestBid ?? bestAsk);
        return { bestBid, bestAsk, mid };
    }
    async place(args) {
        const side = args.isBid ? "bid" : "ask";
        const priceRaw = alignToTick(toRaw(args.price, this.quoteDecimals), this.params.tickSize, side);
        const quantityRaw = alignToLot(toRaw(args.qty, this.baseDecimals), this.params.lotSize);
        const params = {
            pool: this.address,
            baseIsNative: this.baseIsNative,
            isBid: args.isBid,
            priceRaw,
            quantityRaw,
            tickRaw: this.params.tickSize,
            lotRaw: this.params.lotSize,
            minQtyRaw: this.params.minQuantity,
            orderType: args.orderType ?? ORDER_TYPE.ImmediateOrCancel,
            expireTimestampNs: buildExpireNs(args.expireMs ?? 60 * 60_000),
        };
        // Session-key mode: if an owner is set, place on their behalf as the operator.
        return this.ctx.owner ? placeOrderFor(this.exec, params, this.ctx.owner) : placeOrder(this.exec, params);
    }
    async cancel(orderId) {
        return this.ctx.owner
            ? cancelOrderFor(this.exec, this.address, this.ctx.owner, orderId)
            : cancelOrder(this.exec, this.address, orderId);
    }
    async openOrderIds() {
        // `getOwnOpenOrders` is msg.sender-scoped on-chain, but this is a read-only
        // eth_call — setting `account` to the subject costs nothing and lets an
        // operator read the owner's resting orders.
        const ids = await this.ctx.publicClient.readContract({
            address: this.address,
            abi: SPOT_POOL_ABI,
            functionName: "getOwnOpenOrders",
            account: this.subject,
        });
        return [...ids];
    }
    /** Withdrawable vault balance of the base side (uses the native sentinel for native pools). */
    async vaultBase() {
        const token = this.baseIsNative ? NATIVE_SENTINEL : this.params.baseToken;
        const raw = await readWithdrawableBalance(this.ctx.publicClient, this.address, this.subject, token);
        return fromRaw(raw, this.baseDecimals);
    }
    /**
     * Base held in the WALLET — ERC-20 `balanceOf`, or the native balance for a
     * native-base pool. Under the default auto-pull / auto-deliver mode fills
     * settle to the wallet (the vault reads ~0), so THIS is the number that
     * reflects live inventory for skew/hedging. Use `vaultBase()` only when you
     * run the market in manual-vault mode (`setManualVaultMode(true)`).
     *
     * In session-key mode this reads the OWNER's wallet — fills settle to them, not
     * to the operator signing the transactions.
     */
    async walletBase() {
        if (this.baseIsNative) {
            const raw = await this.ctx.publicClient.getBalance({ address: this.subject });
            return fromRaw(raw, this.baseDecimals);
        }
        const raw = await this.ctx.publicClient.readContract({
            address: this.params.baseToken,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [this.subject],
        });
        return fromRaw(raw, this.baseDecimals);
    }
}
//# sourceMappingURL=pool.js.map