// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPredictionManager} from "./interfaces/IPredictionManager.sol";

contract MarketResolver {
    error ZeroAddress();
    error Unauthorized();
    error InvalidMarket();
    error InvalidCloseTime();
    error MarketClosed();
    error AlreadyResolved();
    error PredictionManagerAlreadyConfigured();

    struct Market {
        uint64 closeTime;
        bool outcome;
        bool resolved;
    }

    address public owner;
    IPredictionManager public predictionManager;
    uint256 public nextMarketId = 1;
    mapping(uint256 => Market) public markets;

    event MarketCreated(uint256 indexed marketId, uint256 closeTime);
    event MarketResolved(uint256 indexed marketId, bool outcome, address indexed resolver);
    event PredictionManagerSet(address indexed predictionManager);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
    }

    function setPredictionManager(address manager) external onlyOwner {
        if (manager == address(0)) revert ZeroAddress();
        if (address(predictionManager) != address(0)) revert PredictionManagerAlreadyConfigured();
        predictionManager = IPredictionManager(manager);
        emit PredictionManagerSet(manager);
    }

    function createMarket(uint64 closeTime) external onlyOwner returns (uint256 marketId) {
        if (closeTime <= block.timestamp) revert InvalidCloseTime();
        marketId = nextMarketId++;
        markets[marketId] = Market({closeTime: closeTime, outcome: false, resolved: false});
        emit MarketCreated(marketId, closeTime);
    }

    function resolveMarket(uint256 marketId, bool outcome) external onlyOwner {
        Market storage market = markets[marketId];
        if (market.closeTime == 0) revert InvalidMarket();
        if (market.resolved) revert AlreadyResolved();
        if (block.timestamp < market.closeTime) revert MarketClosed();
        if (address(predictionManager) == address(0)) revert ZeroAddress();

        market.outcome = outcome;
        market.resolved = true;
        predictionManager.resolveMarket(marketId, outcome);
        emit MarketResolved(marketId, outcome, msg.sender);
    }

    function isMarketOpen(uint256 marketId) external view returns (bool) {
        Market memory market = markets[marketId];
        return market.closeTime != 0 && !market.resolved && block.timestamp < market.closeTime;
    }
}
