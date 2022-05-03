// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 { 
  uint256 constant digits = 18;
  uint256 constant MIN = 10 ** 16;  // 0.01
  uint256 constant MAX = 10000 * 10 ** 18; // 10,000

  constructor(string memory name, string memory symbol) ERC20(name, symbol) {
  }

  function mint(uint256 amount) public {
    require(amount >= MIN && amount <= MAX, "TOKEN: Invalid amount"); 
    _mint(msg.sender, amount);
  }
}
