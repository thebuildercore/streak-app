// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {PredictionManager} from "../src/PredictionManager.sol";
import {MarketResolver} from "../src/MarketResolver.sol";
import {ReputationManager} from "../src/ReputationManager.sol";

contract Deploy is Script {
    function run()
        external
        returns (PredictionManager predictions, MarketResolver resolver, ReputationManager reputation)
    {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);
        predictions = new PredictionManager(deployer);
        resolver = new MarketResolver(deployer);
        reputation = new ReputationManager(deployer);
        predictions.setMarketResolver(address(resolver));
        predictions.setReputationManager(address(reputation));
        resolver.setPredictionManager(address(predictions));
        vm.stopBroadcast();
    }
}
