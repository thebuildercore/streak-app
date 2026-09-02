// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IReputationManager} from "./interfaces/IReputationManager.sol";

contract ReputationManager is IReputationManager {
    uint256 public constant BPS = 10_000;
    uint256 public constant MAX_RESOLVED_FOR_VOLUME = 100;
    uint256 public constant MAX_STREAK_FOR_SCORE = 10;

    error ZeroAddress();
    error Unauthorized();
    error PredictionManagerAlreadyConfigured();

    struct Stats {
        uint256 totalPredictions;
        uint256 wins;
        uint256 losses;
        uint256 currentWinningStreak;
        uint256 bestWinningStreak;
    }

    address public owner;
    address public predictionManager;
    mapping(address => Stats) private stats;

    event PredictionManagerSet(address indexed predictionManager);
    event ReputationUpdated(
        address indexed user,
        uint256 totalPredictions,
        uint256 wins,
        uint256 losses,
        uint256 currentWinningStreak,
        uint256 bestWinningStreak,
        uint256 reputationScore
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyPredictionManager() {
        if (msg.sender != predictionManager) revert Unauthorized();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
    }

    function setPredictionManager(address manager) external onlyOwner {
        if (manager == address(0)) revert ZeroAddress();
        if (predictionManager != address(0)) revert PredictionManagerAlreadyConfigured();
        predictionManager = manager;
        emit PredictionManagerSet(manager);
    }

    function recordPrediction(address user) external onlyPredictionManager {
        if (user == address(0)) revert ZeroAddress();
        Stats storage userStats = stats[user];
        ++userStats.totalPredictions;
        _emitUpdate(user, userStats);
    }

    function recordResult(address user, bool won) external onlyPredictionManager {
        if (user == address(0)) revert ZeroAddress();
        Stats storage userStats = stats[user];
        if (won) {
            ++userStats.wins;
            ++userStats.currentWinningStreak;
            if (userStats.currentWinningStreak > userStats.bestWinningStreak) {
                userStats.bestWinningStreak = userStats.currentWinningStreak;
            }
        } else {
            ++userStats.losses;
            userStats.currentWinningStreak = 0;
        }
        _emitUpdate(user, userStats);
    }

    function getUserStats(address user)
        external
        view
        returns (
            uint256 totalPredictions,
            uint256 wins,
            uint256 losses,
            uint256 currentWinningStreak,
            uint256 bestWinningStreak
        )
    {
        Stats memory userStats = stats[user];
        return (
            userStats.totalPredictions,
            userStats.wins,
            userStats.losses,
            userStats.currentWinningStreak,
            userStats.bestWinningStreak
        );
    }

    function getAccuracy(address user) public view returns (uint256 accuracyBps) {
        Stats memory userStats = stats[user];
        uint256 resolved = userStats.wins + userStats.losses;
        if (resolved == 0) return 0;
        return userStats.wins * BPS / resolved;
    }

    function getCurrentStreak(address user) external view returns (uint256) {
        return stats[user].currentWinningStreak;
    }

    function getBestStreak(address user) external view returns (uint256) {
        return stats[user].bestWinningStreak;
    }

    function getReputationScore(address user) public view returns (uint256 score) {
        Stats memory userStats = stats[user];
        uint256 resolved = userStats.wins + userStats.losses;
        uint256 accuracyComponent = getAccuracy(user) * 70 / 100;
        uint256 volumeComponent = (resolved > MAX_RESOLVED_FOR_VOLUME ? MAX_RESOLVED_FOR_VOLUME : resolved) * 20;
        uint256 streakComponent =
            (userStats.currentWinningStreak > MAX_STREAK_FOR_SCORE
                        ? MAX_STREAK_FOR_SCORE
                        : userStats.currentWinningStreak) * 100;
        return accuracyComponent + volumeComponent + streakComponent;
    }

    function _emitUpdate(address user, Stats memory userStats) private {
        emit ReputationUpdated(
            user,
            userStats.totalPredictions,
            userStats.wins,
            userStats.losses,
            userStats.currentWinningStreak,
            userStats.bestWinningStreak,
            getReputationScore(user)
        );
    }
}
