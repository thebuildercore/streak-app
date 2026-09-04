// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @dev Interface for the DreamDEX Event Contract Market.
 * NOTE: You will need to update the exact function signature of `placeOrder` 
 * to match the actual DreamDEX smart contract ABI used in their SDK.
 */
interface IDreamDex {
    function placeOrder(
        address market, 
        uint8 outcome, // e.g., 0 for NO, 1 for YES
        uint256 amount, 
        uint256 limitPrice
    ) external;
}

/**
 * @title CopyTradeVault
 * @dev A personal vault that allows a user to deposit funds and delegate 
 * trading authority to an AI Bot (Session Key) up to a specific allowance.
 */
contract CopyTradeVault {
    using SafeERC20 for IERC20;

    address public immutable owner;
    IERC20 public immutable tradingToken; // e.g., USDC or the Somnia wrapped token
    IDreamDex public immutable dreamDexRouter;

    address public authorizedBot;
    uint256 public botAllowance;

    // Events for your backend indexer to listen to
    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);
    event BotAuthorized(address indexed bot, uint256 allowance);
    event BotRevoked(address indexed bot);
    event TradeExecuted(address indexed market, uint8 outcome, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyBot() {
        require(msg.sender == authorizedBot, "Only authorized bot");
        _;
    }

    constructor(address _tradingToken, address _dreamDexRouter) {
        owner = msg.sender;
        tradingToken = IERC20(_tradingToken);
        dreamDexRouter = IDreamDex(_dreamDexRouter);
    }

    // ==========================================
    // USER FUNCTIONS (Signed by MetaMask)
    // ==========================================

    /**
     * @notice Deposit funds into the vault for the bot to trade with.
     * @dev User must approve this contract to spend their tokens first.
     */
    function deposit(uint256 amount) external onlyOwner {
        tradingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(amount);
    }

    /**
     * @notice Withdraw unused funds back to the user's wallet.
     */
    function withdraw(uint256 amount) external onlyOwner {
        tradingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(amount);
    }

    /**
     * @notice Authorize the AI bot's Session Key and set its spending limit.
     */
    function authorizeBot(address _bot, uint256 _allowance) external onlyOwner {
        authorizedBot = _bot;
        botAllowance = _allowance;
        emit BotAuthorized(_bot, _allowance);
    }

    /**
     * @notice Revoke the bot's trading permissions immediately.
     */
    function revokeBot() external onlyOwner {
        authorizedBot = address(0);
        botAllowance = 0;
        emit BotRevoked(authorizedBot);
    }

    // ==========================================
    // BOT FUNCTIONS (Signed automatically by Node.js/AI Agent)
    // ==========================================

    /**
     * @notice Called by the AI Bot when it detects a trade to copy or counter.
     * @param market The DreamDEX market address.
     * @param outcome The YES/NO direction.
     * @param amount The size of the trade.
     * @param limitPrice The max price to pay (slippage protection).
     */
    function executeCopyTrade(
        address market, 
        uint8 outcome, 
        uint256 amount, 
        uint256 limitPrice
    ) external onlyBot {
        require(botAllowance >= amount, "Exceeds bot allowance");

        // Deduct from the bot's allowance
        botAllowance -= amount;

        // Approve the DreamDEX router to spend the vault's tokens
        tradingToken.safeIncreaseAllowance(address(dreamDexRouter), amount);

        // Call the DreamDEX smart contract to place the order
        // NOTE: Ensure this matches the exact DreamDEX ABI
        dreamDexRouter.placeOrder(market, outcome, amount, limitPrice);

        emit TradeExecuted(market, outcome, amount);
    }
}