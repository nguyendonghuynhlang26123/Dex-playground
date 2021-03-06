// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.8;

import "../interfaces/IERC20.sol";
import "../libs/SafeERC20.sol";


library ProtocolUtils {
    address internal constant ETH_ADDRESS = address(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    /**
     * @notice Get the account's balance of token or ETH
     * @param _token - Address of the token
     * @param _addr - Address of the account
     * @return uint256 - Account's balance of token or ETH
     */
    function balanceOf(IERC20 _token, address _addr) internal view returns (uint256) {
        if (ETH_ADDRESS == address(_token)) {
            return _addr.balance;
        }

        return _token.balanceOf(_addr);
    }

    /**
     * @notice Transfer token or ETH to a destinatary
     * @param _token - Address of the token
     * @param _to - Address of the recipient
     * @param _val - Uint256 of the amount to transfer 
     */
    function transfer(IERC20 _token, address _to, uint256 _val) internal {
        if (ETH_ADDRESS == address(_token)) {
            (bool success, ) = _to.call{value:_val}("");
            require(success, "ProtocolUtils: Failed to transfer ETH");
        }
        else require(SafeERC20.transfer(_token, _to, _val), "ProtocolUtils: Failed to transfer token");
    }

    function transferFrom(IERC20 _token, address _from, address _to, uint256 _val) internal {
        require(ETH_ADDRESS != address(_token), "Cannot transfer from on ETH");
        require(SafeERC20.transferFrom(_token, _from, _to, _val), "ProtocolUtils: Failed to perform transferFrom");
    }
}
