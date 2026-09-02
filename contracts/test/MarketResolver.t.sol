// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MarketResolver} from "../src/MarketResolver.sol";

contract MarketResolverTest is Test {
    MarketResolver internal resolver;

    function setUp() public {
        resolver = new MarketResolver(address(this));
    }

    function testOnlyOwnerCanCreateAndResolve() public {
        vm.prank(address(1));
        vm.expectRevert(MarketResolver.Unauthorized.selector);
        resolver.createMarket(uint64(block.timestamp + 1 days));
    }

    function testInvalidCloseTimeReverts() public {
        vm.expectRevert(MarketResolver.InvalidCloseTime.selector);
        resolver.createMarket(uint64(block.timestamp));
    }

    function testMarketIsOpenUntilCloseAndUnknownMarketsAreClosed() public {
        uint256 marketId = resolver.createMarket(uint64(block.timestamp + 1 days));
        assertTrue(resolver.isMarketOpen(marketId));
        assertFalse(resolver.isMarketOpen(999));
        vm.warp(block.timestamp + 1 days);
        assertFalse(resolver.isMarketOpen(marketId));
    }
}
