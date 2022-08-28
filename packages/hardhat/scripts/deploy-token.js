// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  console.log("Begin deploy tokens");
  const Token = await hre.ethers.getContractFactory("Token");

  const tokenOne = await Token.deploy("token 1", "ONE", 18);
  await tokenOne.deployed();

  const tokenTwo = await Token.deploy("Token 2", "TWO", 18);
  await tokenTwo.deployed();

  const tokenThree = await Token.deploy("Token 3", "THREE", 9);
  await tokenThree.deployed();

  const tokenFour = await Token.deploy("Token 2", "FOUR", 4);
  await tokenFour.deployed();

  console.log("$ONE deployed to:", tokenOne.address);
  console.log("$TWO deployed to:", tokenTwo.address);
  console.log("$THREE deployed to:", tokenThree.address);
  console.log("$FOUR deployed to:", tokenFour.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
