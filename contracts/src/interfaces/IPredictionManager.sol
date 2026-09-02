// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPredictionManager {
    enum ResolutionStatus {
        Pending,
        Win,
        Loss,
        Cancelled
    }

    function createPrediction(uint256 marketId, bool prediction, uint8 confidence)
        external
        returns (uint256 predictionId);
    function resolveMarket(uint256 marketId, bool outcome) external;
    function setMarketResolver(address resolver) external;
    function setReputationManager(address reputationManager) external;
    function getPrediction(uint256 predictionId)
        external
        view
        returns (
            address user,
            uint256 marketId,
            bool prediction,
            uint8 confidence,
            uint64 timestamp,
            ResolutionStatus status
        );
}
