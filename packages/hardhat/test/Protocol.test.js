const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { UniswapMock } = require("./common/UniswapMock");
const { sign, _18digits, prettyNum } = require("./common/utils");

// Helpers
const BN = ethers.BigNumber;
const APPROVE_VALUE = ethers.constants.MaxUint256;

const getDeadline = () => Math.floor(Date.now() / 1000) + 5 * 60;

describe.only("Core Contract Testing", function () {
  let owner;
  let user1;
  let user2;

  let token1;
  let token2;
  let weth;

  let core;
  let handlerUniswap;

  let uniswapMock;

  let provider;

  const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

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
    weth = await Weth.deploy();
    await token1.deployed();
    await token2.deployed();
    await weth.deployed();

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
    await token1.connect(owner).mint(ethers.utils.parseEther("100"));
    await uniswapMock.addLiquidity(
      token1.address,
      weth.address,
      _18digits(100),
      _18digits(1),
      owner.address
    );
    const token1EthReserves = await uniswapMock.getReserves(
      token1.address,
      weth.address
    );
    console.log(
      "token1EthReserves: ",
      token1EthReserves.map((r) => prettyNum(r))
    );

    // Setup pool TOKEN2 - ETH
    await owner.sendTransaction({
      to: weth.address,
      value: _18digits(2),
    });
    await token2.connect(owner).mint(ethers.utils.parseEther("100"));
    await uniswapMock.addLiquidity(
      token2.address,
      weth.address,
      _18digits(100),
      _18digits(2),
      owner.address
    );
    const token2EthReserves = await uniswapMock.getReserves(
      token2.address,
      weth.address
    );
    console.log(
      "token2EthReserves: ",
      token2EthReserves.map((r) => prettyNum(r))
    );

    // Setup contract protocol
    const Core = await ethers.getContractFactory("ProtocolCore");
    core = await Core.deploy();
    await core.deployed();
    console.log("CoreProtocol contract is deployed to:", core.address);

    // Uniswap handler:
    const UniswapHandler = await ethers.getContractFactory("UniswapV2Handler");
    handlerUniswap = await UniswapHandler.deploy(weth.address, ROUTER_ADDRESS);
    await handlerUniswap.deployed();
    console.log(
      "UniswapV2Handler contract is deployed to:",
      handlerUniswap.address
    );
  });

  it("Encode Order should work the same with ethers library", async function () {
    const dl = getDeadline();
    const contractEncode = await core.encodeOrder(
      token1.address,
      token2.address,
      _18digits(10),
      _18digits(29),
      user1.address,
      user2.address,
      dl
    );
    const abiEncoder = new ethers.utils.AbiCoder();
    const libraryEncode = abiEncoder.encode(
      [
        "address",
        "address",
        "uint256",
        "uint256",
        "address",
        "address",
        "uint32",
      ],
      [
        token1.address,
        token2.address,
        _18digits(10),
        _18digits(29),
        user1.address,
        user2.address,
        dl,
      ]
    );

    expect(contractEncode).to.eq(libraryEncode);
  });

  it("Current rate: 1ONE = 2TWO. Create order at 1ONE = 2.2TWO, it should match when 1ONE=2.5TWO", async function () {
    const dl = getDeadline();
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

    // Give user1 1 token ONE to swap
    await token1.connect(user1).mint(ethers.utils.parseEther("1"));

    // User 1 create an order
    const abiEncoder = new ethers.utils.AbiCoder();
    const orderData = abiEncoder.encode(
      [
        "address",
        "address",
        "uint256",
        "uint256",
        "address",
        "address",
        "uint32",
      ],
      [
        token1.address,
        token2.address,
        _18digits(1),
        _18digits(2.2),
        user1.address,
        witnessAddress,
        dl,
      ]
    );
    const key = ethers.utils.keccak256(orderData);

    // 1. Create order 1 ONE = 2.2 TWO
    await token1.connect(user1).approve(core.address, APPROVE_VALUE);
    await expect(
      core
        .connect(user1)
        .createTokenOrder(
          token1.address,
          token2.address,
          _18digits(1),
          _18digits(2.2),
          user1.address,
          witnessAddress,
          dl,
          witnessPrvKey
        )
    )
      .to.emit(core, "OrderSubmited")
      .withArgs(
        key,
        token1.address,
        token2.address,
        _18digits(1),
        _18digits(2.2),
        user1.address,
        witnessAddress,
        dl,
        witnessPrvKey
      );
    expect(await token1.balanceOf(core.address)).to.equal(_18digits(1));
    expect(await token1.balanceOf(user1.address)).to.equal(BN.from(0));

    // 2. SWAP TWO -> ONE to make the price for ONE increase.
    await token2.connect(owner).mint(_18digits(500));
    await uniswapMock.swap(
      token2.address,
      token1.address,
      _18digits(250),
      owner.address
    );
    const exchangeRate = await uniswapMock.getExchangeRate(
      token1.address,
      token2.address
    );
    // Make sure that price is 1 ONE > 2.5TWO
    expect(exchangeRate).to.gt(BN.from(_18digits(2.5)));

    // 3. Assume that there will be a relay bot to execute swap for user1
    // 3.a: Relayer have to use witness's private key to sign their own address
    const signature = sign(ethers, user2.address, witnessPrvKey);
    const estimateExecution = await core
      .connect(user2)
      .estimateGas.executeOrder(
        handlerUniswap.address,
        orderData,
        abiEncoder.encode(
          ["address", "uint256"],
          [user2.address, _18digits(0.1)]
        ),
        signature
      );
    console.log(
      "log ~ file: Protocol.test.js ~ line 280 ~ estimateExecution",
      estimateExecution
    );
  });

  it.only("Test", async () => {
    console.log(
      "ONE -> 0.1 ETH",
      prettyNum(
        await uniswapMock.getAmountIn(
          token1.address,
          weth.address,
          _18digits(0.1)
        )
      )
    );
    // console.log(
    //   "ETH - TWO",
    //   await uniswapMock.getAmountIn(
    //     token1.address,
    //     weth.address,
    //     _18digits(0.1)
    //   )
    // );
  });
});
