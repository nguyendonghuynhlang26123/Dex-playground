// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.8;

import "../interfaces/IWETH.sol";
import "../interfaces/IHandler.sol";
import "../interfaces/uniswapV2/IUniswapV2Pair.sol";
import "../libs/UniswapUtils.sol";
import "../libs/ProtocolUtils.sol";
import "../libs/SafeMath.sol";
import "../libs/SafeERC20.sol";

import "hardhat/console.sol";

/// @notice UniswapV2 Handler used to execute an order
contract UniswapV2Handler is IHandler {
    using SafeMath for uint256;

    IWETH public immutable WETH;
    address public immutable FACTORY;
    bytes32 public immutable FACTORY_CODE_HASH;

    /**
     * @notice Creates the handler
     * @param _factory - Address of the uniswap v2 factory contract
     * @param _weth - Address of WETH contract
     * @param _codeHash - Bytes32 of the uniswap v2 pair contract unit code hash
     */
    constructor(address _factory, IWETH _weth, bytes32 _codeHash) public {
        FACTORY = _factory;
        WETH = _weth;
        FACTORY_CODE_HASH = _codeHash;
    }

    /// @notice receive ETH
    receive() external override payable {
        require(msg.sender != tx.origin, "UniswapV2Handler#receive: NO_SEND_ETH_PLEASE");
    }

    /**
     * @notice Handle an order execution
     * @param _inputToken - Address of the input token
     * @param _outputToken - Address of the output token
     * @param _data - Bytes of arbitrary data
     * @return bought - Amount of output token bought
     */
    function handle(
        IERC20 _inputToken,
        IERC20 _outputToken,
        uint256,
        uint256,
        bytes calldata _data
    ) external payable override returns (uint256 bought) {
         // Load real initial balance, don't trust provided value
        uint256 amount = ProtocolUtils.balanceOf(_inputToken, address(this));
        address inputToken = address(_inputToken);
        address outputToken = address(_outputToken);
        address weth = address(WETH);

        // Decode extra data
        (,address relayer, uint256 fee) = abi.decode(_data, (address, address, uint256));

        if (inputToken == weth || inputToken == ProtocolUtils.ETH_ADDRESS) {
            // Swap WETH -> outputToken
            console.log(amount);
            console.log(fee);
            amount = amount.sub(fee);

            // Convert from ETH to WETH if necessary
            if (inputToken == ProtocolUtils.ETH_ADDRESS) {
                WETH.deposit{ value: amount }();
                inputToken = weth;
            } else {
                WETH.withdraw(fee);
            }

            // Trade
            bought = _swap(inputToken, outputToken, amount, msg.sender);
        } else if (outputToken == weth || outputToken == ProtocolUtils.ETH_ADDRESS) {
            // Swap inputToken -> WETH
            bought = _swap(inputToken, weth, amount, address(this)); 
            // Convert from WETH to ETH if necessary
            if (outputToken == ProtocolUtils.ETH_ADDRESS) {
                WETH.withdraw(bought);
            } else {
                WETH.withdraw(fee);
            }

            // Transfer amount to sender
            bought = bought.sub(fee);
            ProtocolUtils.transfer(IERC20(outputToken), msg.sender, bought);
        } else {
            console.log("Fee in eth: %s", fee);
            // 1. Swap inputToken -> outputToken
            bought = _swap(inputToken, outputToken, amount, address(this)); 
            // 2. Swap outputToken -> fee ETH (auto revert if outputToken is insufficient )
            uint256 feeInOutputToken = _extractFee(outputToken, fee);
            // 3. Transfer token back to the user 
            bought = bought.sub(feeInOutputToken);
            console.log("~ bought", bought);
            ProtocolUtils.transfer(IERC20(outputToken), msg.sender, bought);

            // // Swap inputToken -> WETH -> outputToken
            // //  - inputToken -> WETH
            // bought = _swap(inputToken, weth, amount, address(this)); 
            // // Withdraw fee
            // WETH.withdraw(fee); 
            // // - WETH -> outputToken
            // bought = _swap(weth, outputToken, bought.sub(fee), msg.sender);
        }

        // Send fee to relayer
        (bool successRelayer,) = relayer.call{value: fee}("");
        require(successRelayer, "UniswapV2Handler#handle: TRANSFER_ETH_TO_RELAYER_FAILED");
    }

    /**
     * @notice Simulate an order execution. Note that min/max return is not checked yet 
     * @param _inputToken - Address of the input token
     * @param _outputToken - Address of the output token
     * @param _inputAmount - uint256 of the input token amount
     * @param _data - Bytes of arbitrary data
     * @return bool - Whether the execution can be handled or not
     * @return uint256 - Amount of output token bought
     */
    function simulate(
        IERC20 _inputToken,
        IERC20 _outputToken,
        uint256 _inputAmount,
        bytes calldata _data
    ) external override view returns (bool, uint256) {
        address inputToken = address(_inputToken);
        address outputToken = address(_outputToken);
        address weth = address(WETH);

        // Decode extra data
        (,, uint256 fee) = abi.decode(_data, (address, address, uint256));

        uint256 bought;

        if (inputToken == weth || inputToken == ProtocolUtils.ETH_ADDRESS) {
            if (_inputAmount <= fee) {
                return (false, 0);
            }

            bought = _estimate(weth, outputToken, _inputAmount.sub(fee), true);
        } else if (outputToken == weth || outputToken == ProtocolUtils.ETH_ADDRESS) {
            bought = _estimate(inputToken, weth, _inputAmount, true);
            if (bought <= fee) {
                return (false, 0);
            }

            bought = bought.sub(fee);
        } else {
            bought = _estimate(inputToken, outputToken, _inputAmount, true);
            uint256 feeInOuput = _estimate(outputToken, weth, fee, false);
            if (bought <= feeInOuput) {
                return (false, 0);
            }

            bought = bought.sub(feeInOuput);
        }
        return (bought >= 0, bought);
    }

    /**
     * @notice Estimate output token amount
     * @param _inputToken - Address of the input token
     * @param _outputToken - Address of the output token
     * @param _amount - uint256 of the token amount
     * @param _isInput - a flag to determine _amount is input or output
     * @return bought - Amount of output token bought
     */
    function _estimate(address _inputToken, address _outputToken, uint256 _amount, bool _isInput) internal view returns (uint256 bought) {
        // Get uniswap trading pair
        (address token0, address token1) = UniswapUtils.sortTokens(_inputToken, _outputToken);
        IUniswapV2Pair pair = IUniswapV2Pair(UniswapUtils.pairForSorted(FACTORY, token0, token1, FACTORY_CODE_HASH));

        // Compute limit for uniswap trade
        (uint112 reserve0, uint112 reserve1,) = pair.getReserves();

        // Optimal amounts for uniswap trade
        uint256 reserveIn; uint256 reserveOut;
        if (_inputToken == token0) {
            reserveIn = reserve0;
            reserveOut = reserve1;
        } else {
            reserveIn = reserve1;
            reserveOut = reserve0;
        }

        if (_isInput)
            bought = UniswapUtils.getAmountOut(_amount, reserveIn, reserveOut);
        else bought = UniswapUtils.getAmountIn(_amount, reserveIn, reserveOut);
    }

    /**
     * @notice Swap input token to output token with exact input
     * @param _inputToken - Address of the input token
     * @param _outputToken - Address of the output token
     * @param _inputAmount - uint256 of the input token amount
     * @param _recipient - Address of the recipient
     * @return bought - Amount of output token bought
     */
    function _swap(address _inputToken, address _outputToken, uint256 _inputAmount, address _recipient) internal returns (uint256 bought) {
        // Get uniswap trading pair
        (address token0, address token1) = UniswapUtils.sortTokens(_inputToken, _outputToken);
        IUniswapV2Pair pair = IUniswapV2Pair(UniswapUtils.pairForSorted(FACTORY, token0, token1, FACTORY_CODE_HASH));

        uint256 inputAmount = _inputAmount;
        uint256 prevPairBalance;
        if (_inputToken != address(WETH)) {
            prevPairBalance = ProtocolUtils.balanceOf(IERC20(_inputToken), address(pair));
        }

        // Send tokens to uniswap pair
        require(SafeERC20.transfer(IERC20(_inputToken), address(pair), inputAmount), "UniswapV2Handler#_swap: ERROR_SENDING_TOKENS");

        if (_inputToken != address(WETH)) {
            inputAmount = ProtocolUtils.balanceOf(IERC20(_inputToken), address(pair)).sub(prevPairBalance);
        }

        // Get current reserves
        (uint112 reserve0, uint112 reserve1,) = pair.getReserves();

        // Optimal amounts for uniswap trade
        {
            uint256 reserveIn; uint256 reserveOut;
            if (_inputToken == token0) {
                reserveIn = reserve0;
                reserveOut = reserve1;
            } else {
                reserveIn = reserve1;
                reserveOut = reserve0;
            }
            bought = UniswapUtils.getAmountOut(inputAmount, reserveIn, reserveOut);
        }

        // Determine if output amount is token1 or token0
        uint256 amount1Out; uint256 amount0Out;
        if (_inputToken == token0) {
            amount1Out = bought;
        } else {
            amount0Out = bought;
        }

        // Execute swap
        pair.swap(amount0Out, amount1Out, _recipient, bytes(""));
    }

    /**
     * @notice Swap input token to exact execution cost in WETH. Then withdraw the execution cost.   
     * @param _inputToken - Address of token will be used to pay cost
     * @param _fee - The amount of execution cost in WETH
     * @return feeExtracted - The equivalent amount of _fee in Input token 
     */
    function _extractFee(address _inputToken, uint256 _fee) internal returns (uint256 feeExtracted) {
        // Get uniswap trading pair
        address weth = address(WETH);
        (address token0, address token1) = UniswapUtils.sortTokens(_inputToken, weth);
        IUniswapV2Pair pair = IUniswapV2Pair(UniswapUtils.pairForSorted(FACTORY, token0, token1, FACTORY_CODE_HASH));

        // Get current reserves
        (uint112 reserve0, uint112 reserve1,) = pair.getReserves();
        // Optimal amounts for uniswap trade
        {
            uint256 reserveIn; uint256 reserveOut;
            if (_inputToken == token0) {
                reserveIn = reserve0;
                reserveOut = reserve1;
            } else {
                reserveIn = reserve1;
                reserveOut = reserve0;
            }
            
            console.log("Reserves %s - %s",reserveIn, reserveOut); 
            feeExtracted = UniswapUtils.getAmountIn(_fee, reserveIn, reserveOut);
        }


        uint256 prvBalance = ProtocolUtils.balanceOf(IERC20(_inputToken), address(this)); 
    
        // Determine if output amount is token1 or token0
        uint256 amount1Out; uint256 amount0Out;
        if (_inputToken == token0) {
            amount1Out = _fee;
        } else {
            amount0Out = _fee;
        }
        require(SafeERC20.transfer(IERC20(_inputToken), address(pair), feeExtracted), "UniswapV2Handler#_extractFee: ERROR_SENDING_TOKENS");
        console.log("Fee Extracted %s",feeExtracted);
        console.log("Swap input %s - %s",amount0Out, amount1Out); 
        pair.swap(amount0Out, amount1Out, address(this), bytes(""));

        // Check current balance 
        uint256 curBalance = ProtocolUtils.balanceOf(IERC20(_inputToken), address(this)); 
        console.log("Balance prv: %s; cur: %s, delta %s", prvBalance, curBalance, prvBalance.sub(curBalance) ); 
        feeExtracted = prvBalance.sub(curBalance);
        
        // Withdraw fee
        WETH.withdraw(_fee); 
    }
}