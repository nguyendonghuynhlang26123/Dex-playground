// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IExchangeHandler {

    /**
     * @notice Handle any order execution:  
     * @param _exchangeData - Bytes of the exchange data that the module use to execute the order
     * @return bought - amount of output token bought
     */
    function handleExchange(  
        bytes calldata _exchangeData,
        bytes calldata _relayerData
    ) external returns (uint256 bought);

}
