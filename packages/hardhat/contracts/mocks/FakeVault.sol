// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;
import "../Vault.sol";

contract FakeVault is Vault {
  function depositVault(bytes32 _key, address _tokenAddress, address _user, uint256 _amount) external{
    _depositVault(_key, _tokenAddress, _user, _amount);
  }

  function pullVault(bytes32 _key, address payable _recipient) external {
    _pullVault(_key, _recipient);
  }  
}