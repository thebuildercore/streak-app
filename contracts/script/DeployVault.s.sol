// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CopyTradeVault.sol";

contract DeployVault is Script {
    address internal constant SOMNIA_TESTNET_USDC = 0x83E2be8d114f9661221384b3a50D24B96A56f32c;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        CopyTradeVault vault = new CopyTradeVault(SOMNIA_TESTNET_USDC);
        vm.stopBroadcast();

        console.log("CopyTradeVault deployed at:", address(vault));
    }
}