// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PredictionManager} from "../src/PredictionManager.sol";
import {ReputationManager} from "../src/ReputationManager.sol";
import {MockDreamDEXEventContract} from "./mocks/MockDreamDEXEventContract.sol";

contract IntegrationTest is Test {
    PredictionManager internal predictions;
    MockDreamDEXEventContract internal eventContract;
    ReputationManager internal reputation;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        predictions = new PredictionManager(address(this));
        eventContract = new MockDreamDEXEventContract();
        reputation = new ReputationManager(address(this));
        predictions.setEventContract(address(eventContract));
        predictions.setReputationManager(address(reputation));
        reputation.setPredictionManager(address(predictions));
        eventContract.setEventOpen(1, true);
    }

    function testMultipleUsersRemainIndependent() public {
        uint256 eventId = 1;
        vm.prank(alice);
        predictions.createPrediction(eventId, true, 80);
        vm.prank(bob);
        predictions.createPrediction(eventId, false, 80);
        eventContract.settleEvent(address(predictions), eventId, true);

        (uint256 aliceTotal, uint256 aliceWins, uint256 aliceLosses,,) = reputation.getUserStats(alice);
        (uint256 bobTotal, uint256 bobWins, uint256 bobLosses,,) = reputation.getUserStats(bob);
        assertEq(aliceTotal, 1);
        assertEq(bobTotal, 1);
        assertEq(aliceWins, 1);
        assertEq(aliceLosses, 0);
        assertEq(bobWins, 0);
        assertEq(bobLosses, 1);
    }
}
