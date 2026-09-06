// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPredictionManager} from "./interfaces/IPredictionManager.sol";
import {IReputationManager} from "./interfaces/IReputationManager.sol";
import {IDreamDEXEventContract} from "./interfaces/IDreamDEXEventContract.sol";

contract PredictionManager is IPredictionManager {
    uint8 public constant MAX_CONFIDENCE = 100;

    error ZeroAddress();
    error InvalidEvent();
    error InvalidConfidence();
    error Unauthorized();
    error PredictionNotFound();
    error PredictionAlreadyResolved();
    error EventContractAlreadyConfigured();
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
    IDreamDEXEventContract public eventContract;
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
    event EventContractSet(address indexed eventContract);
    event ReputationManagerSet(address indexed reputationManager);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyEventContract() {
        if (msg.sender != address(eventContract)) revert Unauthorized();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
    }

    function setEventContract(address contractAddress) external onlyOwner {
        if (contractAddress == address(0)) revert ZeroAddress();
        if (address(eventContract) != address(0)) revert EventContractAlreadyConfigured();
        eventContract = IDreamDEXEventContract(contractAddress);
        emit EventContractSet(contractAddress);
    }

    function setReputationManager(address manager) external onlyOwner {
        if (manager == address(0)) revert ZeroAddress();
        if (address(reputationManager) != address(0)) revert ReputationAlreadyConfigured();
        reputationManager = IReputationManager(manager);
        emit ReputationManagerSet(manager);
    }

    function createPrediction(uint256 eventId, bool prediction, uint8 confidence)
        external
        returns (uint256 predictionId)
    {
        if (address(eventContract) == address(0) || !eventContract.isEventOpen(eventId)) {
            revert InvalidEvent();
        }
        if (confidence > MAX_CONFIDENCE) revert InvalidConfidence();

        predictionId = nextPredictionId++;
        predictions[predictionId] = Prediction({
            user: msg.sender,
            marketId: eventId,
            prediction: prediction,
            confidence: confidence,
            timestamp: uint64(block.timestamp),
            status: ResolutionStatus.Pending
        });
        marketPredictionIds[eventId].push(predictionId);

        if (address(reputationManager) != address(0)) reputationManager.recordPrediction(msg.sender);
        emit PredictionCreated(predictionId, msg.sender, eventId, prediction, confidence, block.timestamp);
    }

    function resolveEvent(uint256 eventId, bool outcome) external onlyEventContract {
        uint256[] storage ids = marketPredictionIds[eventId];
        for (uint256 i; i < ids.length; ++i) {
            Prediction storage item = predictions[ids[i]];
            if (item.status != ResolutionStatus.Pending) revert PredictionAlreadyResolved();
            item.status = item.prediction == outcome ? ResolutionStatus.Win : ResolutionStatus.Loss;
            if (address(reputationManager) != address(0)) {
                reputationManager.recordResult(item.user, item.status == ResolutionStatus.Win);
            }
            emit PredictionResolved(ids[i], item.user, eventId, item.status);
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

