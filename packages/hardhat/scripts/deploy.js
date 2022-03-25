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
  const One = await hre.ethers.getContractFactory("Token");
  const tokenOne = await One.deploy("token 1", "ONE");
  await tokenOne.deployed();

  const Two = await hre.ethers.getContractFactory("Token");
  const tokenTwo = await Two.deploy("Token 2", "TWO");
  await tokenTwo.deployed();

  console.log("$ONE deployed to:", tokenOne.address);
  console.log("$TWO deployed to:", tokenTwo.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
