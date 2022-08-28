// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 { 
  uint8 digits; 

  constructor(string memory _name, string memory _symbol, uint8 _digits) ERC20(_name, _symbol) {
    digits = _digits;
  }

  function mint(uint256 amount) public { 
    _mint(msg.sender, amount);
  }

  function decimals() public view override returns (uint8) {
    return digits;
  }
}
