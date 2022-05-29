// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "./libs/SafeMath.sol"; 
import "./interfaces/IERC20.sol"; 
import "./libs/ProtocolUtils.sol"; 
import "hardhat/console.sol";


contract Vault {
    using SafeMath for uint256; 
    address public constant ETH_ADDRESS = address(0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee);

    mapping (bytes32 => bytes) _deposits;

    event VaultDeposited(bytes32 indexed key, bytes value);
    event VaultWithdrawed(bytes32 indexed key, bytes value);
    
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
    function _depositVault(bytes32 _key, address[] memory _tokenAddresses, uint112[] memory _amounts, address owner) internal {
        require(_deposits[_key] == 0, "VaultContract#deposit: VAULT_EXISTS");

        bytes memory value = abi.encode(_tokenAddress, _amounts);
        _deposits[_key] = value;
        uint8 len = _tokenAddresses.length;
        for (uint8 i = 0; i < len; i++){
            if (_tokenAddresses[i] == ETH_ADDRESS) {
                require(msg.value != 0 && msg.value == _amounts[i], "VaultContract#deposit: INVALID_ETH_AMOUNT");
            }
            else ProtocolUtils.transferFrom(IERC20(_tokenAddress), _user, address(this), _amounts[i]);
        }

        emit VaultDeposited(_key, value);
    }
    
    function _pullVault(bytes32 _key, address payable _recipient) internal returns(uint112[] memory amounts) {
        require(_deposits[_key] != 0, "VaultContract#pull: VAULT_EMPTY");

        (address[] memory tokens, amounts) = abi.decode(address[], uint112[]);

        uint8 len = _tokenAddresses.length;
        for (uint8 i = 0; i < len; i++){
            require(ProtocolUtils.balanceOf(IERC20(tokens[i]), address(this)) >= amounts[i], "VaultContract: INSUFFICIENT_FUND");
            ProtocolUtils.transfer(IERC20(tokens[i]), _recipient, amounts[i]);
        }
        
        bytes memory value = _deposits[_key];
        delete _deposits[_key];  
        emit VaultWithdrawed(_key, value);
    }

    function getDeposits(bytes32 key) public view returns (uint112[] memory amounts) {
        (, amounts) = abi.decode(_deposits[key], (address[], uint112[]));
    }
}