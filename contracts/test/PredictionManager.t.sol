// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PredictionManager} from "../src/PredictionManager.sol";
import {ReputationManager} from "../src/ReputationManager.sol";
import {IPredictionManager} from "../src/interfaces/IPredictionManager.sol";
import {MockDreamDEXEventContract} from "./mocks/MockDreamDEXEventContract.sol";

contract PredictionManagerTest is Test {
    PredictionManager internal predictions;
    MockDreamDEXEventContract internal eventContract;
    ReputationManager internal reputation;
    address internal alice = address(0xA11CE);

    function setUp() public {
        predictions = new PredictionManager(address(this));
        eventContract = new MockDreamDEXEventContract();
        reputation = new ReputationManager(address(this));
        predictions.setEventContract(address(eventContract));
        predictions.setReputationManager(address(reputation));
        reputation.setPredictionManager(address(predictions));
        eventContract.setEventOpen(1, true);
    }

    function _eventId() internal pure returns (uint256) {
        return 1;
    }

    function testCreatePredictionStoresImmutableFields() public {
        uint256 eventId = _eventId();
        vm.prank(alice);
        uint256 id = predictions.createPrediction(eventId, true, 80);
        (
            address user,
            uint256 storedMarket,
            bool value,
            uint8 confidence,
            uint64 timestamp,
            IPredictionManager.ResolutionStatus status
        ) = predictions.getPrediction(id);
        assertEq(id, 1);
        assertEq(user, alice);
        assertEq(storedMarket, eventId);
        assertTrue(value);
        assertEq(confidence, 80);
        assertEq(timestamp, uint64(block.timestamp));
        assertEq(uint8(status), uint8(IPredictionManager.ResolutionStatus.Pending));
    }

    function testInvalidConfidenceReverts() public {
        uint256 eventId = _eventId();
        vm.prank(alice);
        vm.expectRevert(PredictionManager.InvalidConfidence.selector);
        predictions.createPrediction(eventId, false, 101);
    }

    function testInvalidEventReverts() public {
        vm.prank(alice);
        vm.expectRevert(PredictionManager.InvalidEvent.selector);
        predictions.createPrediction(999, true, 50);
    }

    function testPredictionIdIncrements() public {
        uint256 eventId = _eventId();
        vm.prank(alice);
        assertEq(predictions.createPrediction(eventId, true, 1), 1);
        vm.prank(address(0xB));
        assertEq(predictions.createPrediction(eventId, false, 2), 2);
    }

    function testResolutionAndUnauthorizedAccess() public {
        uint256 eventId = _eventId();
        vm.prank(alice);
        predictions.createPrediction(eventId, true, 90);
        vm.prank(address(0xBAD));
        vm.expectRevert(PredictionManager.Unauthorized.selector);
        predictions.resolveEvent(eventId, true);
        eventContract.settleEvent(address(predictions), eventId, true);
        (,,,,, IPredictionManager.ResolutionStatus status) = predictions.getPrediction(1);
        assertEq(uint8(status), uint8(IPredictionManager.ResolutionStatus.Win));
    }

    function testCannotResolveTwice() public {
        uint256 eventId = _eventId();
        vm.prank(alice);
        predictions.createPrediction(eventId, true, 90);
        eventContract.settleEvent(address(predictions), eventId, false);
        vm.expectRevert(PredictionManager.PredictionAlreadyResolved.selector);
        eventContract.settleEvent(address(predictions), eventId, true);
    }

    function testFuzzConfidenceAtOrBelowMaximum(uint8 confidence) public {
        uint256 eventId = _eventId();
        vm.assume(confidence <= 100);
        vm.prank(alice);
        predictions.createPrediction(eventId, true, confidence);
    }
}
