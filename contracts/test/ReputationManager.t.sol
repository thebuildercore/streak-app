// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReputationManager} from "../src/ReputationManager.sol";

contract ReputationManagerTest is Test {
    ReputationManager internal reputation;
    address internal manager = address(0xBEEF);
    address internal user = address(0xA11CE);

    function setUp() public {
        reputation = new ReputationManager(address(this));
        reputation.setPredictionManager(manager);
    }

    function testStatsAccuracyStreakAndScore() public {
        vm.startPrank(manager);
        reputation.recordPrediction(user);
        reputation.recordPrediction(user);
        reputation.recordPrediction(user);
        reputation.recordResult(user, true);
        reputation.recordResult(user, true);
        reputation.recordResult(user, false);
        vm.stopPrank();

        (uint256 total, uint256 wins, uint256 losses, uint256 current, uint256 best) = reputation.getUserStats(user);
        assertEq(total, 3);
        assertEq(wins, 2);
        assertEq(losses, 1);
        assertEq(current, 0);
        assertEq(best, 2);
        assertEq(reputation.getAccuracy(user), 6666);
        assertEq(reputation.getReputationScore(user), 4726);
    }

    function testWinningStreakResetsAndBestPersists() public {
        vm.startPrank(manager);
        reputation.recordResult(user, true);
        reputation.recordResult(user, true);
        reputation.recordResult(user, false);
        reputation.recordResult(user, true);
        vm.stopPrank();
        assertEq(reputation.getCurrentStreak(user), 1);
        assertEq(reputation.getBestStreak(user), 2);
    }

    function testUnauthorizedAccountingReverts() public {
        vm.expectRevert(ReputationManager.Unauthorized.selector);
        reputation.recordResult(user, true);
    }
}
