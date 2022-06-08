// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "./libs/SafeMath.sol"; 
import "./interfaces/IERC20.sol"; 
import "./libs/ProtocolUtils.sol";  


contract Vault {
    using SafeMath for uint256; 
    address public constant ETH_ADDRESS = address(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    mapping (bytes32 => uint256) _deposits; 
    mapping (bytes32 => address) _tokens; 

    event VaultDeposited(bytes32 indexed key, uint256 amount);
    event VaultWithdrawed(bytes32 indexed key, uint256 amount);
    
    /**
     * @dev Prevent users to send Ether directly to this contract
     */
    receive() external payable {
        require(
            msg.sender != tx.origin,
            "VaultContract#receive: NO_SEND_ETH_PLEASE"
        );
    }
    /**
        @notice Deposit 
     */
    function _depositVault(bytes32 _key, address _tokenAddress, address _user, uint256 _amount) internal {
        require(_deposits[_key] == 0, "VaultContract#deposit: VAULT_EXISTS");

        _deposits[_key] = _deposits[_key].add(_amount);
        _tokens[_key] = _tokenAddress;
        if (_tokenAddress == ETH_ADDRESS) {
            require(msg.value != 0 && msg.value == _amount, "VaultContract#deposit: INVALID_ETH_AMOUNT");
        }
        else ProtocolUtils.transferFrom(IERC20(_tokenAddress), _user, address(this), _amount);

        emit VaultDeposited(_key, _amount);
    }
    
    function _pullVault(bytes32 _key, address payable _recipient) internal returns(uint256 amount) {
        require(_deposits[_key] > 0, "VaultContract#pull: VAULT_EMPTY");

        address token = _tokens[_key];
        amount = _deposits[_key];
        require(ProtocolUtils.balanceOf(IERC20(token), address(this)) >= amount, "VaultContract: INSUFFICIENT_FUND");

        delete _deposits[_key];
        delete _tokens[_key];
        ProtocolUtils.transfer(IERC20(token), _recipient, amount); 
        emit VaultWithdrawed(_key, amount);
    }

    function getDeposits(bytes32 key) public view returns (uint256) {
        return _deposits[key];
    }
}