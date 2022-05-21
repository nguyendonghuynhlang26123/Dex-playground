const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { balanceSnap, etherSnap } = require("./common/balances");
const { UniswapMock } = require("./common/UniswapMock");
const truncate = (str, maxDecimalDigits) => {
  if (str.includes(".")) {
    const parts = str.split(".");
    return parts[0] + "." + parts[1].slice(0, maxDecimalDigits);
  }
  return str;
};
const prettyNum = (b, unit, digits = 4) =>
  truncate(ethers.utils.formatUnits(b, unit), digits);
const _18digits = (v) => ethers.utils.parseEther(v.toString());
const BN = ethers.BigNumber;
const APPROVE_VALUE = ethers.constants.MaxUint256;
const toBytes32 = ethers.utils.formatBytes32String;

describe("Vault Contract", function () {
  const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  let owner;
  let user1;
  let user2;

  let token1;
  let token2;
  let weth;

  let vault;

  let uniswapMock;

  let provider;

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

    // Deploy uniswap
    uniswapMock = await UniswapMock.init(
      ethers,
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );

    // Setup exchange setup
    //  - mint 1000 token ONE abd 100 TWO for owner
    await token1.connect(owner).mint(ethers.utils.parseEther("1000"));
    await token2.connect(owner).mint(ethers.utils.parseEther("100"));

    //  - approve both token first before add liquidity
    const routerAddress = uniswapMock.getRouterAddress();
    await token1.connect(owner).approve(routerAddress, APPROVE_VALUE);
    await token2.connect(owner).approve(routerAddress, APPROVE_VALUE);
    //  - add liquidity with ratio 1 TWO = 10 ONE to the pool
    await uniswapMock.addLiquidity(
      token1.address,
      token2.address,
      ethers.utils.parseEther("1000"),
      ethers.utils.parseEther("100"),
      owner.address
    );
    //  - log
    const [r1, r2] = await uniswapMock.getReserves(
      token1.address,
      token2.address
    );
    console.log("Reserves: ", prettyNum(r1), prettyNum(r2));

    // Setup vault contract deploy
    const Vault = await ethers.getContractFactory("FakeVault");
    vault = await Vault.deploy();
    await vault.deployed();
    console.log("FakeVault is deployed to:", vault.address);
  });

  it("Vault should contains tokens when deposit", async function () {
    const KEY = toBytes32("KEY");
    const amountTesting = BN.from(_18digits("100"));
    const userBalanceSnap = await balanceSnap(
      token1,
      user1.address,
      "User1's ONE"
    );
    const vaultBalanceSnap = await balanceSnap(
      token1,
      vault.address,
      "Vault's ONE"
    );

    // ** SETUP:
    // mint 100 token ONE for user1
    await token1.connect(user1).mint(amountTesting);
    await token1.connect(user1).approve(vault.address, APPROVE_VALUE);
    await userBalanceSnap.requireIncrease(amountTesting);
    await (await vaultBalanceSnap).requireConstant();

    // ** VERIFY
    await expect(
      vault.depositVault(KEY, token1.address, user1.address, amountTesting)
    )
      .to.emit(vault, "VaultDeposited")
      .withArgs(KEY, amountTesting);
    await userBalanceSnap.requireDecrease(amountTesting);
    await vaultBalanceSnap.requireIncrease(amountTesting);
    expect(await vault.getDeposits(KEY)).to.equal(amountTesting);
  });

  it("Vault should revert if order key exists", async function () {
    const KEY = toBytes32("KEY");
    const amountExisted = BN.from(_18digits("100"));
    const amountDepositing = BN.from(_18digits("20"));
    const vaultBalanceSnap = await balanceSnap(
      token1,
      vault.address,
      "Vault's ONE"
    );

    // ** SETUP
    await token1.connect(user1).mint(amountExisted);
    await token1.connect(user1).approve(vault.address, APPROVE_VALUE);
    await vault.depositVault(KEY, token1.address, user1.address, amountExisted);
    await vaultBalanceSnap.requireIncrease(amountExisted);

    // ** VERIFY
    // Expect revert if key exists
    await token1.connect(user1).mint(amountDepositing);
    await expect(
      vault.depositVault(KEY, token1.address, user1.address, amountDepositing)
    ).to.be.revertedWith("VaultContract#deposit: VAULT_EXISTS");
    await vaultBalanceSnap.requireConstant();
  });

  it.only("Vault should revert if user not approve the token transfer yet", async function () {
    const KEY = toBytes32("KEY");
    const amountTesting = BN.from(_18digits("100"));

    // ** SETUP
    await token1.connect(user1).mint(amountTesting);
    const vaultBalanceSnap = await balanceSnap(
      token1,
      vault.address,
      "Vault's ONE"
    );
    const userBalanceSnap = await balanceSnap(
      token1,
      user1.address,
      "User1's ONE"
    );

    // ** VERIFY
    // Expect revert if key exists
    await expect(
      vault.depositVault(KEY, token1.address, user1.address, amountTesting)
    ).to.be.revertedWith("ProtocolUtils: Failed to perform transferFrom");
    await vaultBalanceSnap.requireConstant();
    await userBalanceSnap.requireConstant();
  });

  it("Token should be able to be pulled", async function () {
    const KEY = toBytes32("KEY");
    const amountTesing = BN.from(_18digits("100"));
    const userBalanceSnap = await balanceSnap(
      token1,
      user1.address,
      "User1's ONE"
    );
    const vaultBalanceSnap = await balanceSnap(
      token1,
      vault.address,
      "Vault's ONE"
    );

    // ** SETUP
    await token1.connect(user1).mint(amountTesing);
    await token1.connect(user1).approve(vault.address, APPROVE_VALUE);
    await vault.depositVault(KEY, token1.address, user1.address, amountTesing);
    await userBalanceSnap.requireConstant();
    await vaultBalanceSnap.requireIncrease(amountTesing);

    // ** VERIFY
    await expect(vault.pullVault(KEY, user1.address))
      .to.emit(vault, "VaultWithdrawed")
      .withArgs(KEY, amountTesing);
    await userBalanceSnap.requireIncrease(amountTesing);
    await vaultBalanceSnap.requireDecrease(amountTesing);
  });

  it("Vault should contains ETH when deposit", async function () {
    const KEY = toBytes32("KEY");
    const amountTesting = BN.from(_18digits("1")); // 1 ETH
    const vaultEtherSnap = await etherSnap(vault.address, "Vault's ETH");

    // ** VERIFY
    await expect(
      vault
        .connect(user1)
        .depositVault(KEY, ETH_ADDRESS, user1.address, amountTesting, {
          value: amountTesting,
        })
    )
      .to.emit(vault, "VaultDeposited")
      .withArgs(KEY, amountTesting);
    await vaultEtherSnap.requireIncrease(amountTesting);
    expect(await vault.getDeposits(KEY)).to.equal(amountTesting);
  });

  it("ETH order should be able to be pulled", async function () {
    const KEY = toBytes32("KEY");
    const amountTesting = BN.from(_18digits("1"));

    // ** SETUP
    await vault
      .connect(user1)
      .depositVault(KEY, ETH_ADDRESS, user1.address, amountTesting, {
        value: amountTesting,
      });

    const userEtherSnap = await etherSnap(user1.address, "User1's ETH");
    const vaultEtherSnap = await etherSnap(vault.address, "Vault's ETH");

    // ** VERIFY
    await expect(vault.pullVault(KEY, user1.address))
      .to.emit(vault, "VaultWithdrawed")
      .withArgs(KEY, amountTesting);
    await userEtherSnap.requireIncrease(amountTesting);
    await vaultEtherSnap.requireDecrease(amountTesting);
  });
});
