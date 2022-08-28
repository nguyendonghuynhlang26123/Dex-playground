// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");

const UNISWAP_FACTORY = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
const UNISWAP_FACTORY_CODEHASH =
  "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";
const WMATIC = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";

async function main() {
  // Setup contract protocol
  const Core = await ethers.getContractFactory("OrderProtocol");
  const EntryOrder = await ethers.getContractFactory("EntryOrders");
  const UniswapHandler = await ethers.getContractFactory("UniswapV2Handler");

  const core = await Core.deploy();
  await core.deployed();

  const entryOrderModule = await EntryOrder.deploy();
  await entryOrderModule.deployed();

  // Uniswap handler:
  const handlerUniswap = await UniswapHandler.deploy(
    UNISWAP_FACTORY,
    WMATIC,
    UNISWAP_FACTORY_CODEHASH
  );
  await handlerUniswap.deployed();

  console.log("OrderProtocol: ", core.address);
  console.log("EntryOrderModule: ", entryOrderModule.address);
  console.log("UniswapV2Handler: ", handlerUniswap.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
