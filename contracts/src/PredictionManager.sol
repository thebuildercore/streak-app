// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPredictionManager} from "./interfaces/IPredictionManager.sol";
import {IReputationManager} from "./interfaces/IReputationManager.sol";

contract PredictionManager is IPredictionManager {
    uint8 public constant MAX_CONFIDENCE = 100;

    error ZeroAddress();
    error InvalidMarket();
    error InvalidConfidence();
    error Unauthorized();
    error PredictionNotFound();
    error PredictionAlreadyResolved();
    error ResolverAlreadyConfigured();
    error ReputationAlreadyConfigured();

    struct Prediction {
        address user;
        uint256 marketId;
        bool prediction;
        uint8 confidence;
        uint64 timestamp;
        ResolutionStatus status;
    }

    address public owner;
    address public marketResolver;
    IReputationManager public reputationManager;
    uint256 public nextPredictionId = 1;

    mapping(uint256 => Prediction) private predictions;
    mapping(uint256 => uint256[]) private marketPredictionIds;

    event PredictionCreated(
        uint256 indexed predictionId,
        address indexed user,
        uint256 indexed marketId,
        bool prediction,
        uint8 confidence,
        uint256 timestamp
    );
    event PredictionResolved(
        uint256 indexed predictionId, address indexed user, uint256 indexed marketId, ResolutionStatus status
    );
    event MarketResolverSet(address indexed resolver);
    event ReputationManagerSet(address indexed reputationManager);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyMarketResolver() {
        if (msg.sender != marketResolver) revert Unauthorized();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
    }

    function setMarketResolver(address resolver) external onlyOwner {
        if (resolver == address(0)) revert ZeroAddress();
        if (marketResolver != address(0)) revert ResolverAlreadyConfigured();
        marketResolver = resolver;
        emit MarketResolverSet(resolver);
    }

    function setReputationManager(address manager) external onlyOwner {
        if (manager == address(0)) revert ZeroAddress();
        if (address(reputationManager) != address(0)) revert ReputationAlreadyConfigured();
        reputationManager = IReputationManager(manager);
        emit ReputationManagerSet(manager);
    }

    function createPrediction(uint256 marketId, bool prediction, uint8 confidence)
        external
        returns (uint256 predictionId)
    {
        if (marketResolver == address(0) || !IMarketResolverView(marketResolver).isMarketOpen(marketId)) {
            revert InvalidMarket();
        }
        if (confidence > MAX_CONFIDENCE) revert InvalidConfidence();

        predictionId = nextPredictionId++;
        predictions[predictionId] = Prediction({
            user: msg.sender,
            marketId: marketId,
            prediction: prediction,
            confidence: confidence,
            timestamp: uint64(block.timestamp),
            status: ResolutionStatus.Pending
        });
        marketPredictionIds[marketId].push(predictionId);

        if (address(reputationManager) != address(0)) reputationManager.recordPrediction(msg.sender);
        emit PredictionCreated(predictionId, msg.sender, marketId, prediction, confidence, block.timestamp);
    }

    function resolveMarket(uint256 marketId, bool outcome) external onlyMarketResolver {
        uint256[] storage ids = marketPredictionIds[marketId];
        for (uint256 i; i < ids.length; ++i) {
            Prediction storage item = predictions[ids[i]];
            if (item.status != ResolutionStatus.Pending) revert PredictionAlreadyResolved();
            item.status = item.prediction == outcome ? ResolutionStatus.Win : ResolutionStatus.Loss;
            if (address(reputationManager) != address(0)) {
                reputationManager.recordResult(item.user, item.status == ResolutionStatus.Win);
            }
            emit PredictionResolved(ids[i], item.user, marketId, item.status);
        }
    }

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
        )
    {
        Prediction memory item = predictions[predictionId];
        if (item.user == address(0)) revert PredictionNotFound();
        return (item.user, item.marketId, item.prediction, item.confidence, item.timestamp, item.status);
    }

    function getMarketPredictionIds(uint256 marketId) external view returns (uint256[] memory) {
        return marketPredictionIds[marketId];
    }
}

interface IMarketResolverView {
    function isMarketOpen(uint256 marketId) external view returns (bool);
}
