// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {PredictionManager} from "../src/PredictionManager.sol";
import {ReputationManager} from "../src/ReputationManager.sol";

contract Deploy is Script {
    error MissingDreamDEXEventContract();

    function run()
        external
        returns (PredictionManager predictions, ReputationManager reputation)
    {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address eventContract = vm.envAddress("DREAMDEX_EVENT_CONTRACT");
        if (eventContract == address(0)) revert MissingDreamDEXEventContract();

        vm.startBroadcast(deployerKey);
        predictions = new PredictionManager(deployer);
        reputation = new ReputationManager(deployer);
        predictions.setEventContract(eventContract);
        predictions.setReputationManager(address(reputation));
        vm.stopBroadcast();
    }
}
