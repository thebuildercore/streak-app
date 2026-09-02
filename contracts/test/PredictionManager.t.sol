// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PredictionManager} from "../src/PredictionManager.sol";
import {MarketResolver} from "../src/MarketResolver.sol";
import {ReputationManager} from "../src/ReputationManager.sol";
import {IPredictionManager} from "../src/interfaces/IPredictionManager.sol";

contract PredictionManagerTest is Test {
    PredictionManager internal predictions;
    MarketResolver internal resolver;
    ReputationManager internal reputation;
    address internal alice = address(0xA11CE);

    function setUp() public {
        predictions = new PredictionManager(address(this));
        resolver = new MarketResolver(address(this));
        reputation = new ReputationManager(address(this));
        predictions.setMarketResolver(address(resolver));
        predictions.setReputationManager(address(reputation));
        reputation.setPredictionManager(address(predictions));
        resolver.setPredictionManager(address(predictions));
    }

    function _market() internal returns (uint256) {
        return resolver.createMarket(uint64(block.timestamp + 1 days));
    }

    function testCreatePredictionStoresImmutableFields() public {
        uint256 marketId = _market();
        vm.prank(alice);
        uint256 id = predictions.createPrediction(marketId, true, 80);
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
        assertEq(storedMarket, marketId);
        assertTrue(value);
        assertEq(confidence, 80);
        assertEq(timestamp, uint64(block.timestamp));
        assertEq(uint8(status), uint8(IPredictionManager.ResolutionStatus.Pending));
    }

    function testInvalidConfidenceReverts() public {
        uint256 marketId = _market();
        vm.prank(alice);
        vm.expectRevert(PredictionManager.InvalidConfidence.selector);
        predictions.createPrediction(marketId, false, 101);
    }

    function testInvalidMarketReverts() public {
        vm.prank(alice);
        vm.expectRevert(PredictionManager.InvalidMarket.selector);
        predictions.createPrediction(999, true, 50);
    }

    function testPredictionIdIncrements() public {
        uint256 marketId = _market();
        vm.prank(alice);
        assertEq(predictions.createPrediction(marketId, true, 1), 1);
        vm.prank(address(0xB));
        assertEq(predictions.createPrediction(marketId, false, 2), 2);
    }

    function testResolutionAndUnauthorizedAccess() public {
        uint256 marketId = _market();
        vm.prank(alice);
        predictions.createPrediction(marketId, true, 90);
        vm.warp(block.timestamp + 1 days);
        vm.prank(address(0xBAD));
        vm.expectRevert(PredictionManager.Unauthorized.selector);
        predictions.resolveMarket(marketId, true);
        resolver.resolveMarket(marketId, true);
        (,,,,, IPredictionManager.ResolutionStatus status) = predictions.getPrediction(1);
        assertEq(uint8(status), uint8(IPredictionManager.ResolutionStatus.Win));
    }

    function testCannotResolveTwice() public {
        uint256 marketId = _market();
        vm.prank(alice);
        predictions.createPrediction(marketId, true, 90);
        vm.warp(block.timestamp + 1 days);
        resolver.resolveMarket(marketId, false);
        vm.expectRevert(MarketResolver.AlreadyResolved.selector);
        resolver.resolveMarket(marketId, true);
    }

    function testFuzzConfidenceAtOrBelowMaximum(uint8 confidence) public {
        uint256 marketId = _market();
        vm.assume(confidence <= 100);
        vm.prank(alice);
        predictions.createPrediction(marketId, true, confidence);
    }
}
