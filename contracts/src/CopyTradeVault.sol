// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

interface IDreamDexBinaryPool {
    function placeBinaryOrder(
        uint8 kind,
        uint256 price,
        uint256 quantity,
        uint64 expireTimestampNs,
        uint8 orderType,
        uint8 selfMatchingOption,
        address builder,
        uint96 builderFeeBpsTimes1k,
        uint64 userData
    ) external payable returns (bool success, uint128 id);
}

contract CopyTradeVault {
    using SafeERC20 for IERC20;

    address public immutable owner;
    IERC20 public immutable tradingToken; // e.g., Testnet USDC

    address public authorizedBot;
    uint256 public botAllowance;

    // Events for backend indexer
    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);
    event BotAuthorized(address indexed bot, uint256 allowance);
    event BotRevoked(address indexed bot);
    event TradeExecuted(address indexed marketPool, uint8 kind, uint256 amount, uint128 orderId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyBot() {
        require(msg.sender == authorizedBot, "Only authorized bot");
        _;
    }

    constructor(address _tradingToken) {
        owner = msg.sender;
        tradingToken = IERC20(_tradingToken);
    }


    // USER FUNCTIONS (Signed by MetaMask)

    function deposit(uint256 amount) external onlyOwner {
        tradingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(amount);
    }

    function withdraw(uint256 amount) external onlyOwner {
        tradingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(amount);
    }

    function authorizeBot(address _bot, uint256 _allowance) external onlyOwner {
        authorizedBot = _bot;
        botAllowance = _allowance;
        emit BotAuthorized(_bot, _allowance);
    }

    function revokeBot() external onlyOwner {
        authorizedBot = address(0);
        botAllowance = 0;
        emit BotRevoked(authorizedBot);
    }

    // BOT FUNCTIONS (Signed automatically by Node.js/AI Agent)


    /**
     * @notice Called by the AI Bot when it detects a trade to copy or counter.
     * @param marketPool The specific DreamDEX BinaryPool address.
     * @param kind 0=BUY_YES, 1=SELL_YES, 2=BUY_NO, 3=SELL_NO
     * @param amount The size of the trade.
     * @param limitPrice The max price to pay (slippage protection).
     */
    function executeCopyTrade(
        address marketPool, 
        uint8 kind, 
        uint256 amount, 
        uint256 limitPrice
    ) external onlyBot {
        require(botAllowance >= amount, "Exceeds bot allowance");

        // Deduct from the bot's allowance
        botAllowance -= amount;

        // Approve the specific binary pool to spend the vault's tokens
        tradingToken.safeIncreaseAllowance(marketPool, amount);

        // Execute the trade directly on the specific market pool
        (bool success, uint128 orderId) = IDreamDexBinaryPool(marketPool).placeBinaryOrder(
            kind,
            limitPrice,
            amount,
            type(uint64).max, // expireTimestampNs (never expire)
            0, // orderType (0 = Limit order)
            0, // selfMatchingOption
            address(0), // builder (no fee routing for now)
            0, // builderFeeBpsTimes1k
            0 // userData
        );

        require(success, "Trade failed");

        // Emit the orderId so your Node.js backend can track if it filled
        emit TradeExecuted(marketPool, kind, amount, orderId);
    }
}