// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDreamDEXEventContract {
    function isEventOpen(uint256 eventId) external view returns (bool);
}