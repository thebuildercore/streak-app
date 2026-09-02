// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IReputationManager {
    function recordPrediction(address user) external;
    function recordResult(address user, bool won) external;
    function getUserStats(address user)
        external
        view
        returns (
            uint256 totalPredictions,
            uint256 wins,
            uint256 losses,
            uint256 currentWinningStreak,
            uint256 bestWinningStreak
        );
    function getAccuracy(address user) external view returns (uint256 accuracyBps);
    function getReputationScore(address user) external view returns (uint256 score);
}
