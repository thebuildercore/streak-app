// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CopyTradeVault.sol";

contract DeployVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // NOTE: Replace these with the actual Testnet addresses for USDC and DreamDEX
        address testnetUSDC = 0x1234567890123456789012345678901234567890; 
        address dreamDexRouter = 0x0987654321098765432109876543210987654321;

        vm.startBroadcast(deployerPrivateKey);

        CopyTradeVault vault = new CopyTradeVault(testnetUSDC, dreamDexRouter);
        
        vm.stopBroadcast();
    }
}