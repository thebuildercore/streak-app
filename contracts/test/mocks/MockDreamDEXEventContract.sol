// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPredictionManager} from "../../src/interfaces/IPredictionManager.sol";
import {IDreamDEXEventContract} from "../../src/interfaces/IDreamDEXEventContract.sol";

contract MockDreamDEXEventContract is IDreamDEXEventContract {
    mapping(uint256 => bool) public eventOpen;

    function setEventOpen(uint256 eventId, bool open) external {
        eventOpen[eventId] = open;
    }

    function isEventOpen(uint256 eventId) external view returns (bool) {
        return eventOpen[eventId];
    }

    function settleEvent(address predictions, uint256 eventId, bool outcome) external {
        IPredictionManager(predictions).resolveEvent(eventId, outcome);
    }
}