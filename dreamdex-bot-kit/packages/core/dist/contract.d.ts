/**
 * @license
 * Copyright DreamDEX S.A.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/somnia-chain/dreamdex-bot-kit/blob/main/LICENSE
 */
import type { PublicClient } from "viem";
export declare const SPOT_POOL_ABI: readonly [{
    readonly type: "function";
    readonly name: "placeOrder";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "isBid";
        readonly type: "bool";
    }, {
        readonly name: "userData";
        readonly type: "uint64";
    }, {
        readonly name: "price";
        readonly type: "uint256";
    }, {
        readonly name: "quantity";
        readonly type: "uint256";
    }, {
        readonly name: "expireTimestampNs";
        readonly type: "uint64";
    }, {
        readonly name: "orderType";
        readonly type: "uint8";
    }, {
        readonly name: "selfMatchingOption";
        readonly type: "uint8";
    }, {
        readonly name: "builder";
        readonly type: "address";
    }, {
        readonly name: "builderFeeBpsTimes1k";
        readonly type: "uint96";
    }];
    readonly outputs: readonly [{
        readonly name: "success";
        readonly type: "bool";
    }, {
        readonly name: "orderId";
        readonly type: "uint128";
    }];
}, {
    readonly type: "function";
    readonly name: "cancelOrder";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint128";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "reduceOrder";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint128";
    }, {
        readonly name: "newQuantityRemaining";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "deposit";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "depositNative";
    readonly stateMutability: "payable";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "withdraw";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "getPoolParams";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "baseToken_";
        readonly type: "address";
    }, {
        readonly name: "quoteToken_";
        readonly type: "address";
    }, {
        readonly name: "makerFeeBpsTimes1k_";
        readonly type: "uint256";
    }, {
        readonly name: "takerFeeBpsTimes1k_";
        readonly type: "uint256";
    }, {
        readonly name: "tickSize_";
        readonly type: "uint256";
    }, {
        readonly name: "minQuantity_";
        readonly type: "uint256";
    }, {
        readonly name: "lotSize_";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "getBookLevels";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "isBid";
        readonly type: "bool";
    }, {
        readonly name: "numLevels";
        readonly type: "uint64";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple[]";
        readonly components: readonly [{
            readonly name: "price";
            readonly type: "uint256";
        }, {
            readonly name: "quantity";
            readonly type: "uint256";
        }];
    }];
}, {
    readonly type: "function";
    readonly name: "getWithdrawableBalance";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "getOwnOpenOrders";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint128[]";
    }];
}, {
    readonly type: "function";
    readonly name: "getAutoPullRequirement";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "isBid";
        readonly type: "bool";
    }, {
        readonly name: "price";
        readonly type: "uint256";
    }, {
        readonly name: "quantity";
        readonly type: "uint256";
    }, {
        readonly name: "builderFeeBpsTimes1k";
        readonly type: "uint96";
    }];
    readonly outputs: readonly [{
        readonly name: "inputToken";
        readonly type: "address";
    }, {
        readonly name: "requiredAmount";
        readonly type: "uint256";
    }, {
        readonly name: "delta";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "placeOrderFor";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "isBid";
        readonly type: "bool";
    }, {
        readonly name: "userData";
        readonly type: "uint64";
    }, {
        readonly name: "price";
        readonly type: "uint256";
    }, {
        readonly name: "quantity";
        readonly type: "uint256";
    }, {
        readonly name: "expireTimestampNs";
        readonly type: "uint64";
    }, {
        readonly name: "orderType";
        readonly type: "uint8";
    }, {
        readonly name: "selfMatchingOption";
        readonly type: "uint8";
    }, {
        readonly name: "builder";
        readonly type: "address";
    }, {
        readonly name: "builderFeeBpsTimes1k";
        readonly type: "uint96";
    }];
    readonly outputs: readonly [{
        readonly name: "success";
        readonly type: "bool";
    }, {
        readonly name: "orderId";
        readonly type: "uint128";
    }];
}, {
    readonly type: "function";
    readonly name: "cancelOrderFor";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "orderId";
        readonly type: "uint128";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "setManualVaultMode";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "enabled";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "getManualVaultMode";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "user";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "isOperatorAuthorized";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "operator";
        readonly type: "address";
    }, {
        readonly name: "selector";
        readonly type: "bytes4";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "getOrder";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint128";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "orderId";
            readonly type: "uint128";
        }, {
            readonly name: "isBid";
            readonly type: "bool";
        }, {
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly name: "userData";
            readonly type: "uint64";
        }, {
            readonly name: "price";
            readonly type: "uint256";
        }, {
            readonly name: "fullQuantity";
            readonly type: "uint256";
        }, {
            readonly name: "quantityRemaining";
            readonly type: "uint256";
        }, {
            readonly name: "expireTimestampNs";
            readonly type: "uint64";
        }];
    }];
}];
/** OperatorPermissionsRegistry — grant/revoke operator approvals (owner key). */
export declare const OPERATOR_REGISTRY_ABI: readonly [{
    readonly type: "function";
    readonly name: "setOperatorApprovalForPool";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "pool";
        readonly type: "address";
    }, {
        readonly name: "operator";
        readonly type: "address";
    }, {
        readonly name: "selectors";
        readonly type: "bytes4[]";
    }, {
        readonly name: "approved";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "setOperatorApprovalGlobal";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "operator";
        readonly type: "address";
    }, {
        readonly name: "selectors";
        readonly type: "bytes4[]";
    }, {
        readonly name: "approved";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "setOperatorDenialForPool";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "pool";
        readonly type: "address";
    }, {
        readonly name: "operator";
        readonly type: "address";
    }, {
        readonly name: "selectors";
        readonly type: "bytes4[]";
    }, {
        readonly name: "denied";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
}];
/** Per-selector operator capability identifiers (see the operator docs). */
export declare const OPERATOR_SELECTOR: {
    readonly placeOrderFor: "0x80054449";
    readonly cancelOrderFor: "0xe37b444b";
    readonly reduceOrderFor: "0x364c2587";
};
export declare const ERC20_ABI: readonly [{
    readonly type: "function";
    readonly name: "approve";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "allowance";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "balanceOf";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
}];
export declare const TOPIC: {
    readonly OrderPlaced: "0xd90f62f61ee2f606b132cfdfd883ddd079228b6fd6bffd9d7cf848daf824639d";
    readonly OrderFilled: "0xc87f4223e9e7c4e4f39f9b34fc9d64d78cdb95d9035b3748cbde59521261a399";
    readonly OrderCancelled: "0x06ff08ed6b6987bb7df963009d8b54dc03988f4e465c009924929bb010fe03e7";
    readonly OrderExpired: "0x6003d149bc2c6baa0780d4302ad5f925fef5715780d3b6f7d2da5476548da101";
};
export interface PoolParams {
    baseToken: `0x${string}`;
    quoteToken: `0x${string}`;
    makerFeeBpsTimes1k: bigint;
    takerFeeBpsTimes1k: bigint;
    tickSize: bigint;
    minQuantity: bigint;
    lotSize: bigint;
}
export declare function readPoolParams(client: PublicClient, pool: `0x${string}`): Promise<PoolParams>;
export interface BookLevel {
    priceRaw: bigint;
    sizeRaw: bigint;
}
/**
 * Read aggregated book levels for one side. `getBookLevels` returns an empty
 * array on an empty book (it does NOT revert), so we let real RPC/ABI errors
 * propagate instead of masking them as an empty book.
 */
export declare function readBookLevels(client: PublicClient, pool: `0x${string}`, isBid: boolean, depth?: number): Promise<BookLevel[]>;
export declare function readWithdrawableBalance(client: PublicClient, pool: `0x${string}`, owner: `0x${string}`, token: `0x${string}`): Promise<bigint>;
