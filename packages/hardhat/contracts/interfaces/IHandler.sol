// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "../interfaces/IERC20.sol";

interface IHandler {
    /// @notice receive ETH
    receive() external payable;

    /**
     * @notice Handle an order execution
     * @param _inputToken - Address of the input token
     * @param _outputToken - Address of the output token
     * @param _inputAmount - uint256 of the input token amount
     * @param _minReturn - uint256 of the min return amount of output token
     * @param _data - Bytes of arbitrary data
     * @return bought - Amount of output token bought
     */
    function handle(
        IERC20 _inputToken,
        IERC20 _outputToken,
        uint256 _inputAmount,
        uint256 _minReturn,
        bytes calldata _data
    ) external payable returns (uint256 bought);

    /**
     * @notice Simulate an order execution
     * @param _inputToken - Address of the input token
     * @param _outputToken - Address of the output token
     * @param _inputAmount - uint256 of the input token amount
     * @param _data - Bytes of arbitrary data
     * @return bool - Whether the execution can be handled or not
     * @return uint256 - Amount of output token espected to be bought
     */
    function simulate(
        IERC20 _inputToken,
        IERC20 _outputToken,
        uint256 _inputAmount,
        bytes calldata _data
    ) external view returns (bool, uint256);
}