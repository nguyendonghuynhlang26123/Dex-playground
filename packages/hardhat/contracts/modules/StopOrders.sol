// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.8;

import "../interfaces/IModule.sol";
import "../interfaces/IHandler.sol";
import "../libs/SafeMath.sol";
import "../libs/SafeERC20.sol";
import "../libs/ProtocolUtils.sol";


/// @notice Module used to execute stop orders create in the core contract
contract StopOrders is IModule {
    using SafeMath for uint256;
    address public constant ETH_ADDRESS = address(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    /// @notice receive ETH
    receive() external override payable { }

    /**
     * @notice Executes an order
     * @param _inputToken - Address of the input token
     * @param _owner - Address of the order's owner
     * @param _data - Bytes of the order's data
     * @param _auxData - Bytes of the auxiliar data used for the handlers to execute the order
     * @return bought - amount of output token bought
     */
    function execute(
        IERC20 _inputToken,
        uint256,
        address payable _owner,
        bytes calldata _data,
        bytes calldata _auxData
    ) external override returns (uint256 bought) {
        (
            IERC20 outputToken,
            uint256 maxReturn
        ) = abi.decode(
            _data,
            (
                IERC20,
                uint256
            )
        );

        (IHandler handler) = abi.decode(_auxData, (IHandler));

        // Do not trust on _inputToken, it can mismatch the real balance
        uint256 inputAmount = ProtocolUtils.balanceOf(_inputToken, address(this));
        _transferAmount(_inputToken, address(handler), inputAmount);

        handler.handle(
            _inputToken,
            outputToken,
            inputAmount,
            maxReturn,
            _auxData
        );

        bought = ProtocolUtils.balanceOf(outputToken, address(this));
        require(bought <= maxReturn, "StopOrders#execute: ISSUFICIENT_BOUGHT_TOKENS");

        _transferAmount(outputToken, _owner, bought);

        return bought;
    }

    /**
     * @notice Check whether an order can be executed or not
     * @param _inputToken - Address of the input token
     * @param _inputAmount - uint256 of the input token amount (order amount)
     * @param _data - Bytes of the order's data
     * @param _auxData - Bytes of the auxiliar data used for the handlers to execute the order
     * @return bool - whether the order can be executed or not
     */
    function canExecute(
        IERC20 _inputToken,
        uint256 _inputAmount,
        bytes calldata _data,
        bytes calldata _auxData
    ) external override view returns (bool) {
        (
            IERC20 outputToken,
            uint256 maxReturn
        ) = abi.decode(
            _data,
            (
                IERC20,
                uint256
            )
        );
        (IHandler handler) = abi.decode(_auxData, (IHandler));

        (bool success, uint256 bought) = handler.simulate(
            _inputToken,
            outputToken,
            _inputAmount,
            _auxData
        );

        return (success && bought <= maxReturn);
    }

    /**
     * @notice Transfer token or Ether amount to a recipient
     * @param _token - Address of the token
     * @param _to - Address of the recipient
     * @param _amount - uint256 of the amount to be transferred
     */
    function _transferAmount(
        IERC20 _token,
        address payable _to,
        uint256 _amount
    ) internal {
        if (address(_token) == ETH_ADDRESS) {
            (bool success,) = _to.call{value: _amount}("");
            require(success, "StopOrders#_transferAmount: ETH_TRANSFER_FAILED");
        } else {
            require(SafeERC20.transfer(_token, _to, _amount), "StopOrders#_transferAmount: TOKEN_TRANSFER_FAILED");
        }
    }
}