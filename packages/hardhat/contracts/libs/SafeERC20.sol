// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.8;

import "../interfaces/IERC20.sol";
import "hardhat/console.sol";

library SafeERC20 {
    function transfer(IERC20 _token, address _to, uint256 _val) internal returns (bool) {
        (bool success, bytes memory data) = address(_token).call(abi.encodeWithSelector(_token.transfer.selector, _to, _val));
        return success && (data.length == 0 || abi.decode(data, (bool)));
    }

    function transferFrom(IERC20 _token, address _from, address _to, uint256 _val) internal returns (bool) {
        (bool success, bytes memory data) = address(_token).call(abi.encodeWithSelector(_token.transferFrom.selector, _from, _to, _val));
        console.log("Success %s", success);
        return success && (data.length == 0 || abi.decode(data, (bool)));
    }    
}