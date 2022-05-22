const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { balanceSnap, etherSnap } = require("./common/balances");
const { UniswapMock } = require("./common/UniswapMock");
const { sign, _18digits, prettyNum } = require("./common/utils");

const BN = ethers.BigNumber;
// CONSTANTS
const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const FACTORY_CODE_HASH =
  "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";

const STANDARD_GAS_PRICE = BN.from(36 * 1000000000); // 36 GWEI
const FAST_GAS_PRICE = BN.from(50 * 1000000000); // 36 GWEI

const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

// Helpers
const APPROVE_VALUE = ethers.constants.MaxUint256;

const mintToken = async (token, user, value) => {
  if (token.address === WETH_ADDRESS) {
    await user.sendTransaction({
      to: WETH_ADDRESS,
      value: _18digits(value),
    });
  } else {
    await token.connect(user).mint(_18digits(value));
  }
};
describe.only("Core Contract", function () {
  let owner;
  let user1;
  let user2;

  let token1;
  let token2;
  let weth;

  let core;
  let limitOrderModule;
  let handlerUniswap;

  let uniswapMock;

  let provider;

  const AVG_ESTIMATE_EXECUTE_COST = BN.from("230000");

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    provider = waffle.provider;
    console.log(
      `List of account:\nOwner: ${owner.address}\nUser1: ${user1.address}\nUser2: ${user2.address}`
    );

    // Setup Token deployment
    const Token = await ethers.getContractFactory("Token");
    const Weth = await ethers.getContractFactory("WETH9");
    token1 = await Token.deploy("token 1", "ONE");
    token2 = await Token.deploy("token 2", "TWO");
    weth = await Weth.attach(WETH_ADDRESS);
    await token1.deployed();
    await token2.deployed();
    await weth.deployed();

    console.log(
      `Token1: ${token1.address}\nToken2: ${token2.address}\nWeth: ${weth.address}`
    );

    // Approve tokens
    await token1.connect(owner).approve(ROUTER_ADDRESS, APPROVE_VALUE);
    await token2.connect(owner).approve(ROUTER_ADDRESS, APPROVE_VALUE);
    await weth.connect(owner).approve(ROUTER_ADDRESS, APPROVE_VALUE);

    // Setup uniswap
    uniswapMock = await UniswapMock.init(
      ethers,
      FACTORY_ADDRESS,
      ROUTER_ADDRESS
    );

    // Setup pool TOKEN1 - TOKEN 2, rate: 1ONE = 2TWO
    //  - mint 1000 token ONE abd 100 TWO for owner
    await token1.connect(owner).mint(ethers.utils.parseEther("1000"));
    await token2.connect(owner).mint(ethers.utils.parseEther("2000"));
    //  - approve both token first before add liquidity
    //  - add liquidity with ratio 1ONE = 2 TWO to the pool
    await uniswapMock.addLiquidity(
      token1.address,
      token2.address,
      ethers.utils.parseEther("1000"),
      ethers.utils.parseEther("2000"),
      owner.address
    );

    // Setup pool TOKEN1 - ETH
    await owner.sendTransaction({
      to: weth.address,
      value: _18digits(1),
    });
    await token1.connect(owner).mint(_18digits(200));
    await uniswapMock.addLiquidity(
      token1.address,
      weth.address,
      _18digits(200),
      _18digits(1),
      owner.address
    );
    const token1EthReserves = await uniswapMock.getReserves(
      token1.address,
      weth.address
    );
    console.log(
      "token1EthReserves: ",
      token1EthReserves.map((r) => prettyNum(r)),
      " Rate ",
      prettyNum(await uniswapMock.getExchangeRate(weth.address, token1.address))
    );

    // Setup pool TOKEN2 - ETH
    await owner.sendTransaction({
      to: weth.address,
      value: _18digits(2),
    });
    await token2.connect(owner).mint(_18digits(400));
    await uniswapMock.addLiquidity(
      token2.address,
      weth.address,
      _18digits(400),
      _18digits(1),
      owner.address
    );
    const token2EthReserves = await uniswapMock.getReserves(
      token2.address,
      weth.address
    );
    console.log(
      "token2EthReserves: ",
      token2EthReserves.map((r) => prettyNum(r)),
      " Rate ",
      prettyNum(await uniswapMock.getExchangeRate(weth.address, token2.address))
    );

    // Setup contract protocol
    const Core = await ethers.getContractFactory("OrderProtocol");
    const LimitOrder = await ethers.getContractFactory("LimitOrders");
    core = await Core.deploy();
    limitOrderModule = await LimitOrder.deploy();
    await core.deployed();
    await limitOrderModule.deployed();
    console.log("OrderProtocol contract is deployed to:", core.address);
    console.log(
      "LimitOrder Module contract is deployed to:",
      limitOrderModule.address
    );

    // Uniswap handler:
    const UniswapHandler = await ethers.getContractFactory("UniswapV2Handler");
    handlerUniswap = await UniswapHandler.deploy(
      FACTORY_ADDRESS,
      weth.address,
      FACTORY_CODE_HASH
    );
    await handlerUniswap.deployed();
    console.log(
      "UniswapV2Handler contract is deployed to:",
      handlerUniswap.address
    );
  });

  describe("UniswapV2 Order flow", async function () {
    it("Verify ETH->Token order. Current rate: 1ETH = 100 ONE. Create order at 1ETH = 120TWO, it should match when 1ETH >= 120.5TWO", async function () {
      const abiEncoder = new ethers.utils.AbiCoder();
      const secret = ethers.utils
        .hexlify(ethers.utils.randomBytes(21))
        .replace("0x", "");
      const fullSecret = `2022001812713618127252${secret}`;
      const { privateKey: witnessPrvKey, address: witnessAddress } =
        new ethers.Wallet(fullSecret);
      console.log(
        "log ~ file: Protocol.test.js ~ line 177 ~ witnessPrvKey, witnessAddress",
        witnessPrvKey,
        witnessAddress
      );

      // Setup:
      const moduleData = abiEncoder.encode(
        ["address", "uint256"],
        [token1.address, _18digits(120)]
      );
      const orderData = [
        limitOrderModule.address,
        ETH_ADDRESS,
        user1.address,
        witnessAddress,
        _18digits(1),
        moduleData,
      ];

      const userBalance1Snap = await balanceSnap(
        token1,
        user1.address,
        "User1's ONE"
      );
      const userEthSnap = await etherSnap(user1.address, "User1's ETH");
      const vaultBalance1Snap = await balanceSnap(
        token1,
        core.address,
        "Vault's ONE"
      );
      const vaulltEthSnap = await etherSnap(core.address, "Vault's ETH");

      // ** SETUP
      // 1. Create order 1 ETH = 120 ONE
      await expect(
        core.connect(user1).createOrder(...orderData, witnessPrvKey, {
          value: _18digits(1),
        })
      ).to.emit(core, "OrderCreated");

      await userBalance1Snap.requireConstant();
      await userEthSnap.requireDecrease(_18digits(1), true);
      await vaulltEthSnap.requireIncrease(_18digits(1));
      await vaultBalance1Snap.requireConstant();

      // 2 MAKE sure that 1 ETH > 120 ONE
      await token1.connect(owner).mint(_18digits(27.5));
      await uniswapMock.swap(
        token1.address,
        weth.address,
        _18digits(27.5),
        owner.address
      );
      const wethToToken1Rate = await uniswapMock.getExchangeRate(
        weth.address,
        token1.address
      );
      console.log("SETUP ~ wethToToken1Rate", prettyNum(wethToToken1Rate));
      // Make sure that price is 1 ETH > 120 ONE
      expect(wethToToken1Rate).to.gt(BN.from(_18digits(120)));

      // 3. Get all estimation needed
      const signature = sign(ethers, user2.address, witnessPrvKey);
      const estimateGas = await core
        .connect(user2)
        .estimateGas.executeOrder(
          limitOrderModule.address,
          ETH_ADDRESS,
          user1.address,
          _18digits(1),
          moduleData,
          signature,
          abiEncoder.encode(
            ["address", "address", "uint256"],
            [handlerUniswap.address, user2.address, AVG_ESTIMATE_EXECUTE_COST]
          )
        );
      console.log(
        `Estimate Gas Execution: ${estimateGas} gas -> ${prettyNum(
          STANDARD_GAS_PRICE.mul(estimateGas)
        )} ETH `
      );

      // ** VERIFY EXECUTION
      const relayerPrvBalance = await provider.getBalance(user2.address);
      const user1PrvBalanceOne = await token1.balanceOf(user1.address);
      const executeData = abiEncoder.encode(
        ["address", "address", "uint256"],
        [
          handlerUniswap.address,
          user2.address,
          STANDARD_GAS_PRICE.mul(estimateGas),
        ]
      );
      expect(
        await core.connect(user2).canExecuteOrder(...orderData, executeData),
        "Order should be executed"
      ).to.eq(true);
      await expect(
        core
          .connect(user2)
          .executeOrder(
            limitOrderModule.address,
            ETH_ADDRESS,
            user1.address,
            _18digits(1),
            moduleData,
            signature,
            executeData,
            {
              gasPrice: STANDARD_GAS_PRICE,
            }
          )
      ).to.emit(core, "OrderExecuted");

      // Verify that user's order is matched
      const bought = (await token1.balanceOf(user1.address)).sub(
        user1PrvBalanceOne
      );
      expect(bought).to.be.gt(BN.from(_18digits(120)));
      console.log(`Order matched and bought ${prettyNum(bought)} ONE for user`);

      // Verify that executor's balance is secured (may gains more than spent but not in loss!)
      expect(await provider.getBalance(user2.address)).to.be.gte(
        relayerPrvBalance
      );

      // Verify assets in vault
      vaulltEthSnap.requireConstant();
      vaultBalance1Snap.requireConstant();
    });

    it("Verify Token->ETH order. Current rate: 1TWO = 0.005 ETH. Create order at 100TWO = 0.8ETH (1TWO = 0.008ETH), it should match when 100TWO >= 0.83ETH", async function () {
      const abiEncoder = new ethers.utils.AbiCoder();
      const secret = ethers.utils
        .hexlify(ethers.utils.randomBytes(21))
        .replace("0x", "");
      const fullSecret = `2022001812713618127252${secret}`;
      const { privateKey: witnessPrvKey, address: witnessAddress } =
        new ethers.Wallet(fullSecret);
      console.log(
        "witnessPrvKey, witnessAddress: ",
        witnessPrvKey,
        witnessAddress
      );

      // Setup:
      const AMOUNT_IN = _18digits(100);
      const AMOUNT_OUT = _18digits(0.8);
      const moduleData = abiEncoder.encode(
        ["address", "uint256"],
        [ETH_ADDRESS, AMOUNT_OUT]
      );
      const orderData = [
        limitOrderModule.address,
        token2.address,
        user1.address,
        witnessAddress,
        AMOUNT_IN,
        moduleData,
      ];

      const userBalance2Snap = await balanceSnap(
        token2,
        user1.address,
        "User1's TWO"
      );
      const userEthSnap = await etherSnap(user1.address, "User1's ETH");
      const vaultBalance2Snap = await balanceSnap(
        token2,
        core.address,
        "Vault's TWO"
      );
      const vaulltEthSnap = await etherSnap(core.address, "Vault's ETH");

      // ** SETUP
      // 1. Create order 1 ONE = 0.008 ETH
      await token2.connect(user1).mint(AMOUNT_IN);
      await token2.connect(user1).approve(core.address, APPROVE_VALUE);
      await expect(
        core.connect(user1).createOrder(...orderData, witnessPrvKey)
      ).to.emit(core, "OrderCreated");

      await userEthSnap.reset();
      await userBalance2Snap.requireConstant();
      await vaulltEthSnap.requireConstant();
      await vaultBalance2Snap.requireIncrease(AMOUNT_IN);

      // 2. MAKE sure that 1 TWO > 0.008 ETH
      await owner.sendTransaction({
        to: weth.address,
        value: _18digits(1.3),
      });
      await uniswapMock.swap(
        weth.address,
        token2.address,
        _18digits(1.3),
        owner.address
      );
      const token2ToWeth = await uniswapMock.getAmountOut(
        token2.address,
        weth.address,
        AMOUNT_IN
      );
      console.log("SETUP ~ 100 token2 -> WETH", prettyNum(token2ToWeth));
      // Make sure that price is 1 ETH > 120 ONE
      expect(token2ToWeth).to.gt(_18digits(0.008));

      // 3. Get all estimation needed
      const signature = sign(ethers, user2.address, witnessPrvKey);
      const estimateGas = await core
        .connect(user2)
        .estimateGas.executeOrder(
          limitOrderModule.address,
          token2.address,
          user1.address,
          AMOUNT_IN,
          moduleData,
          signature,
          abiEncoder.encode(
            ["address", "address", "uint256"],
            [handlerUniswap.address, user2.address, AVG_ESTIMATE_EXECUTE_COST]
          )
        );
      console.log(
        `Estimate Gas Execution: ${estimateGas} gas -> ${prettyNum(
          STANDARD_GAS_PRICE.mul(estimateGas)
        )} ETH `
      );

      // ** VERIFY EXECUTION
      const relayerPrvBalance = await provider.getBalance(user2.address);
      const user1PrvBalanceOne = await provider.getBalance(user1.address);
      const executeData = abiEncoder.encode(
        ["address", "address", "uint256"],
        [
          handlerUniswap.address,
          user2.address,
          STANDARD_GAS_PRICE.mul(estimateGas),
        ]
      );
      expect(
        await core.connect(user2).canExecuteOrder(...orderData, executeData),
        "Order should be executed"
      ).to.eq(true);

      await expect(
        core
          .connect(user2)
          .executeOrder(
            limitOrderModule.address,
            token2.address,
            user1.address,
            AMOUNT_IN,
            moduleData,
            signature,
            executeData,
            {
              gasPrice: STANDARD_GAS_PRICE,
            }
          )
      ).to.emit(core, "OrderExecuted");

      // Verify that user's order is matched
      const bought = (await provider.getBalance(user1.address)).sub(
        user1PrvBalanceOne
      );
      expect(bought).to.be.gt(AMOUNT_OUT);
      console.log(`Order matched and bought ${prettyNum(bought)} ONE for user`);

      // Verify that executor's balance is secured (may gains more than spent but not in loss!)
      expect(await provider.getBalance(user2.address)).to.be.gte(
        relayerPrvBalance
      );

      // Verify assets in vault
      vaulltEthSnap.requireConstant();
      vaultBalance2Snap.requireConstant();
    });

    it("Verify Token->Token order. Current rate: 1ONE = 2TWO. Create order at 10ONE = 22TWO, it should match when 1ONE=25TWO", async function () {
      const abiEncoder = new ethers.utils.AbiCoder();
      const secret = ethers.utils
        .hexlify(ethers.utils.randomBytes(21))
        .replace("0x", "");
      const fullSecret = `2022001812713618127252${secret}`;
      const { privateKey: witnessPrvKey, address: witnessAddress } =
        new ethers.Wallet(fullSecret);
      console.log(
        "witnessPrvKey, witnessAddress: ",
        witnessPrvKey,
        witnessAddress
      );

      // Setup:
      const AMOUNT_IN = _18digits(10);
      const AMOUNT_OUT = _18digits(22);
      const moduleData = abiEncoder.encode(
        ["address", "uint256"],
        [token2.address, AMOUNT_OUT]
      );
      const orderData = [
        limitOrderModule.address,
        token1.address,
        user1.address,
        witnessAddress,
        AMOUNT_IN,
        moduleData,
      ];

      // ** SETUP
      // 1. Create order 1 ONE = 2.2 TWO
      await token1.connect(user1).mint(AMOUNT_IN);
      await token1.connect(user1).approve(core.address, APPROVE_VALUE);
      await expect(
        core.connect(user1).createOrder(...orderData, witnessPrvKey)
      ).to.emit(core, "OrderCreated");

      // 2. MAKE sure that 1 ONE > 2.2 TWO (+10%)
      // 2a. Make sure pair ONE-ETH has price 1ONE > 0.0055 ETH
      await owner.sendTransaction({
        to: weth.address,
        value: _18digits(0.5),
      });
      await uniswapMock.swap(
        weth.address,
        token1.address,
        _18digits(0.5),
        owner.address
      );
      const token1ToWeth = await uniswapMock.getAmountOut(
        token1.address,
        weth.address,
        AMOUNT_IN
      );
      console.log("SETUP ~ 10 ONE -> WETH", prettyNum(token1ToWeth));
      // Make sure that price is 1ONE > 0.06 ETH
      expect(token1ToWeth).to.gt(_18digits(0.102));

      // 2b. Make sure pair WETH-TWO has price 0.10 ETH > 22 ETH
      await token2.connect(owner).mint(_18digits(20));
      await uniswapMock.swap(
        token2.address,
        weth.address,
        _18digits(20),
        owner.address
      );
      const wethToToken2 = await uniswapMock.getAmountOut(
        weth.address,
        token2.address,
        _18digits(0.1)
      );
      console.log("SETUP ~ 0.1 WETH -> TWO", prettyNum(wethToToken2));
      // Make sure that price is 1ONE > 0.06 ETH
      expect(wethToToken2).to.gt(_18digits(22));

      // 3. Get all estimation needed
      const signature = sign(ethers, user2.address, witnessPrvKey);
      const estimateGas = await core
        .connect(user2)
        .estimateGas.executeOrder(
          limitOrderModule.address,
          token1.address,
          user1.address,
          AMOUNT_IN,
          moduleData,
          signature,
          abiEncoder.encode(
            ["address", "address", "uint256"],
            [handlerUniswap.address, user2.address, AVG_ESTIMATE_EXECUTE_COST]
          )
        );
      console.log(
        `Estimate Gas Execution: ${estimateGas} gas -> ${prettyNum(
          STANDARD_GAS_PRICE.mul(estimateGas)
        )} ETH `
      );

      // ** VERIFY EXECUTION
      const relayerPrvBalance = await provider.getBalance(user2.address);
      const user1PrvBalanceOne = await token2.balanceOf(user1.address);
      const executeData = abiEncoder.encode(
        ["address", "address", "uint256"],
        [
          handlerUniswap.address,
          user2.address,
          STANDARD_GAS_PRICE.mul(estimateGas),
        ]
      );
      expect(
        await core.connect(user2).canExecuteOrder(...orderData, executeData),
        "Order should be executed"
      ).to.eq(true);
      await expect(
        core
          .connect(user2)
          .executeOrder(
            limitOrderModule.address,
            token1.address,
            user1.address,
            AMOUNT_IN,
            moduleData,
            signature,
            executeData,
            {
              gasPrice: STANDARD_GAS_PRICE,
            }
          )
      ).to.emit(core, "OrderExecuted");

      // Verify that user's order is matched
      const bought = (await token2.balanceOf(user1.address)).sub(
        user1PrvBalanceOne
      );
      expect(bought).to.be.gt(AMOUNT_OUT);
      console.log(`Order matched and bought ${prettyNum(bought)} TWO for user`);

      // Verify that executor's balance is secured (may gains more than spent but not in loss!)
      expect(await provider.getBalance(user2.address)).to.be.gte(
        relayerPrvBalance
      );
    });
  });
});
