// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");

const UNISWAP_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const UNISWAP_FACTORY_CODEHASH =
  "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";
const WETH = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
async function main() {
  // Setup contract protocol
  const Core = await ethers.getContractFactory("OrderProtocol");
  const LimitOrder = await ethers.getContractFactory("LimitOrders");
  const UniswapHandler = await ethers.getContractFactory("UniswapV2Handler");

  const core = await Core.deploy();
  await core.deployed();

  const limitOrderModule = await LimitOrder.deploy();
  await limitOrderModule.deployed();

  // Uniswap handler:
  const handlerUniswap = await UniswapHandler.deploy(
    UNISWAP_FACTORY,
    WETH,
    UNISWAP_FACTORY_CODEHASH
  );
  await handlerUniswap.deployed();

  console.log("OrderProtocol: ", core.address);
  console.log("LimitOrderModule: ", limitOrderModule.address);
  console.log("UniswapV2Handler: ", handlerUniswap.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
