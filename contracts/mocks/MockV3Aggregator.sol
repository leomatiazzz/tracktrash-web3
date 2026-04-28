// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockV3Aggregator {
    uint8 public immutable decimals;
    int256 private _answer;

    constructor(uint8 decimals_, int256 initialAnswer) {
        decimals = decimals_;
        _answer = initialAnswer;
    }

    function updateAnswer(int256 newAnswer) external {
        _answer = newAnswer;
    }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (1, _answer, block.timestamp, block.timestamp, 1);
    }
}
