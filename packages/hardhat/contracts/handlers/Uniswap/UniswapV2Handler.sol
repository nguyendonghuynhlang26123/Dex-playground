// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";  
import "../../interfaces/IExchangeHandler.sol";
import "../../interfaces/IWeth.sol";
import "../../libs/OrderUtils.sol";
import "./IUniswapV2Router.sol";
import "hardhat/console.sol";


contract UniswapV2Handler is IExchangeHandler {
    using SafeMath for uint256; 

    IWETH public immutable WETH;
    IUniswapV2Router public immutable UNISWAP_ROUTER;
    
    constructor(address wethAddress, address router){
        WETH = IWETH(wethAddress);
        UNISWAP_ROUTER = IUniswapV2Router(router);
    }

    /**
     * @notice Handle any order execution:  
     * @param _exchangeData - Bytes of order details
     * @param _relayerData - Bytes of the exchange data that relayers use to execute the order
     * @return bought - amount of output token bought
     */
    function handleExchange(  
        bytes calldata _exchangeData,
        bytes calldata _relayerData
    ) external override returns (uint256 bought){
        address weth = address(WETH); 
        (
            address inputToken,
            address outputToken,
            ,
            uint256 minOutputAmount, 
            , 
            ,
            uint32 deadline
        ) = OrderUtils.decodeOrder(_exchangeData);

        (address relayer, uint256 fee) = abi.decode(_relayerData, (address, uint256));
        uint256 amount = IERC20(inputToken).balanceOf(address(this)); // Input token must be transfered here before handling
        console.log("I'm here");

        if (inputToken == weth) {
            // Swap WETH -> outputToken
            console.log("Option 1");
            // 1. Get fee from input: 
            amount = amount.sub(fee);

            // 2. With draw fee first
            WETH.withdraw(fee);

            // 3. Perform swap
            bought = _swap(inputToken, outputToken, amount, minOutputAmount, msg.sender, deadline);
        } else if (outputToken == weth) {
            // Swap inputToken -> WETH => Get fee from output
            console.log("Option 2");

            // 1. Swap first 
            bought = _swap(inputToken, weth, amount, minOutputAmount, address(this), deadline);

            // 2. Withdraw fee
            WETH.withdraw(fee);

            // 3. Transfer (bought - fee) back to the receipient
            bought = bought.sub(fee);
            IERC20(weth).transfer(msg.sender, bought);
        } else {
            // Swap inputToken -> WETH -> outputToken
            console.log("Option 3");

            // 1. Swap inputToken -> X WETH
            bought = _swap(inputToken, weth, amount, minOutputAmount, address(this), deadline);
            console.log("%s INPUT TOKEN -> %s WETH", amount, bought);

            // 2. Withdraw fee
            WETH.withdraw(fee);
            console.log("Withdraw %s WETH", fee);

            // 3. Swap (X-fee) WETH -> outputToken
            console.log("%s WETH -> OUTPUTTOKEN", bought.sub(fee));
            bought = _swap(weth, outputToken, bought.sub(fee), minOutputAmount, msg.sender, deadline);
        }

        // Send fee to relayer (In ETH)
        (bool successRelayer,) = relayer.call{value: fee}("");
        require(successRelayer, "UniswapV2Handler: TRANSFER_ETH_TO_RELAYER_FAILED");
    }

    function _swap(address _inputToken, address _outputToken, uint256 _inputAmount, uint256 _amountOutMin, address _recipient, uint256 deadline) internal returns (uint256 bought) {
        address[] memory paths = new address[](2);
        paths[0] = _inputToken;
        paths[1] = _outputToken;
        bought = UNISWAP_ROUTER.swapExactTokensForTokens(_inputAmount, _amountOutMin, paths, _recipient, deadline)[0];
    }
}
