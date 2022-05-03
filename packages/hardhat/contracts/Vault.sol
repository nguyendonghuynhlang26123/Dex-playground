// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0; 

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Vault {
    using SafeMath for uint256; 
    
    mapping (bytes32 => uint256) _deposits; 
    mapping (bytes32 => address) _tokens; 
    event VaultDeposited(bytes32 indexed key, uint256 amount);
    event VaultWithdrawed(bytes32 indexed key, uint256 amount);

    /**
        @notice Deposit 
     */
    function _depositVault(bytes32 _key, address _tokenAddress, address _user, uint256 _amount) internal {
        require(_deposits[_key] == 0, "VaultContract: VAULT_EXISTS");

        _deposits[_key] = _deposits[_key].add(_amount);
        _tokens[_key] = _tokenAddress;
        SafeERC20.safeTransferFrom(IERC20(_tokenAddress), _user, address(this), _amount);

        emit VaultDeposited(_key, _amount);
    }
    
    function _pullVault(bytes32 _key, address _recipient) internal {
        require(_deposits[_key] > 0, "VaultContract: VAULT_EMPTY");

        address token = _tokens[_key];
        uint256 amount = _deposits[_key];
        require(IERC20(token).balanceOf(address(this)) >= amount, "VaultContract: INSUFFICIENT_FUND");

        delete _deposits[_key];
        delete _tokens[_key];

        IERC20(token).transfer(_recipient, amount);
        emit VaultWithdrawed(_key, amount);
    }

    function getDeposits(bytes32 key) external view returns (uint256) {
        return _deposits[key];
    }
}