const config = require("./config");
class UniswapMock {
  constructor(ethers, _factory, _router) {
    this.factory = _factory;
    this.ethers = ethers;
    this.router = _router;
  }

  static async init(ethers, factoryAddress, routerAddress) {
    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    const factory = Factory.attach(factoryAddress);

    const Router = await ethers.getContractFactory("UniswapV2Router02");
    const router = Router.attach(routerAddress);

    return new UniswapMock(ethers, factory, router);
  }

  async addLiquidity(addressToken1, addressToken2, amount1, amount2, to) {
    const BigNumber = ethers.BigNumber;
    const amountMin1 = BigNumber.from(amount1) // (100 - X)% desired output
      .mul(10000 - config.slippage * 100)
      .div(10000);
    const amountMin2 = BigNumber.from(amount2) // (100 - X)% desired output
      .mul(10000 - config.slippage * 100)
      .div(10000);
    const dl = Math.floor(Date.now() / 1000) + config.deadline;

    await this.router.addLiquidity(
      addressToken1,
      addressToken2,
      amount1,
      amount2,
      amountMin1,
      amountMin2,
      to,
      dl
    );
  }

  getRouterAddress() {
    return this.router.address;
  }

  async getReserves(addressToken1, addressToken2) {
    const BigNumber = ethers.BigNumber.from;
    const pairContract = await this.getPair(addressToken1, addressToken2);
    const [r1, r2] = await pairContract.getReserves();
    if (BigNumber(addressToken1).lt(BigNumber(addressToken2))) return [r1, r2];
    else return [r2, r1];
  }

  async getPair(token1, token2) {
    const pairAddress = await this.factory.getPair(token1, token2);
    const Pair = await this.ethers.getContractFactory(
      "contracts/mocks/UniswapV2/UniswapV2Pair.sol:UniswapV2Pair"
    );
    return await Pair.attach(pairAddress);
  }

  async getExchangeRate(token1, token2) {
    const [r1, r2] = await this.getReserves(token1, token2);

    return await this.router.getAmountOut("1000000000000000000", r1, r2);
  }

  async getAmountOut(token1, token2, amountIn) {
    const [r1, r2] = await this.getReserves(token1, token2);
    return await this.router.getAmountOut(amountIn, r1, r2);
  }

  async getAmountIn(token1, token2, amountOut) {
    const [r1, r2] = await this.getReserves(token1, token2);
    return await this.router.getAmountIn(amountOut, r1, r2);
  }

  async swap(addressToken1, addressToken2, amount, to) {
    const [r1, r2] = await this.getReserves(addressToken1, addressToken2);
    const BigNumber = ethers.BigNumber;
    const amountIn = BigNumber.from(amount);
    const amountOut = await this.router.getAmountOut(amountIn, r1, r2);
    const amountOutMin = BigNumber.from(amountOut) // (100 - X)% desired output
      .mul(10000 - config.slippage * 100)
      .div(10000);
    const dl = Math.floor(Date.now() / 1000) + config.deadline;

    await this.router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      [addressToken1, addressToken2],
      to,
      dl
    );
  }
}

module.exports = {
  UniswapMock,
};
