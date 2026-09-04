// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CopyTradeVault.sol";

contract DeployVault is Script {
    function run() external {

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // You must replace this with the actual testnet usdc adress 
        address testnetUSDC = 0x83e2be8d114F9661221384B3a50d24B96a56F32C; // Example Somnia Testnet USDC

       // start broadcasting
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the Vault!
        CopyTradeVault vault = new CopyTradeVault(testnetUSDC);
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        // Log the deployed address to your terminal so you can copy it
        console.log("CopyTradeVault deployed at:", address(vault));
    }
}