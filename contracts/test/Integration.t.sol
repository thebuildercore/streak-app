// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PredictionManager} from "../src/PredictionManager.sol";
import {MarketResolver} from "../src/MarketResolver.sol";
import {ReputationManager} from "../src/ReputationManager.sol";

contract IntegrationTest is Test {
    PredictionManager internal predictions;
    MarketResolver internal resolver;
    ReputationManager internal reputation;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        predictions = new PredictionManager(address(this));
        resolver = new MarketResolver(address(this));
        reputation = new ReputationManager(address(this));
        predictions.setMarketResolver(address(resolver));
        predictions.setReputationManager(address(reputation));
        reputation.setPredictionManager(address(predictions));
        resolver.setPredictionManager(address(predictions));
    }

    function testMultipleUsersRemainIndependent() public {
        uint256 marketId = resolver.createMarket(uint64(block.timestamp + 1 days));
        vm.prank(alice);
        predictions.createPrediction(marketId, true, 80);
        vm.prank(bob);
        predictions.createPrediction(marketId, false, 80);
        vm.warp(block.timestamp + 1 days);
        resolver.resolveMarket(marketId, true);

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
