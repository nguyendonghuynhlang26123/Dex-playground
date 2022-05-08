const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

const BN = ethers.BigNumber;
const provider = waffle.provider;
const TRANSACTION_COST = BN.from("20000000000000000");
const approxCost = (value) => {
  return [value.sub(TRANSACTION_COST), value, value.add(TRANSACTION_COST)];
};
async function balanceSnap(token, address, account = "") {
  let snapBalance = await token.balanceOf(address);
  return {
    requireConstant: async function () {
      expect(snapBalance, `${account} balance should remain constant`).to.eq(
        await token.balanceOf(address)
      );
    },
    requireIncrease: async function (delta) {
      const realincrease = (await token.balanceOf(address)).sub(snapBalance);
      const expectedBalance = snapBalance.add(delta);
      expect(
        snapBalance.add(delta),
        `${account} should increase by ${delta} - but increased by ${realincrease}`
      ).to.eq(await token.balanceOf(address));
      // Update balance
      snapBalance = expectedBalance;
    },
    requireDecrease: async function (delta) {
      const realdecrease = snapBalance.sub(await token.balanceOf(address));
      const expectedBalance = snapBalance.sub(delta);
      expect(
        snapBalance.sub(delta),
        `${account} should decrease by ${delta} - but decreased by ${realdecrease}`
      ).to.eq(await token.balanceOf(address));
      // Update balance
      snapBalance = expectedBalance;
    },
    restore: async function () {
      await token.setBalance(snapBalance, address);
    },
    reset: async function () {
      snapBalance = await token.balanceOf(address);
    },
  };
}

async function etherSnap(address, account = "") {
  let snapBalance = await provider.getBalance(address);
  return {
    requireConstant: async function (withTxCost = false) {
      if (!withTxCost)
        expect(snapBalance, `${account} balance should remain constant`).to.eq(
          await provider.getBalance(address)
        );
      else {
        const expectedValues = approxCost(await provider.getBalance(address));
        expect(snapBalance, `${account} balance should remain constant`)
          .to.gt(expectedValues[0])
          .and.to.be.lt(expectedValues[2]);
        snapBalance = expectedValues[0];
      }
    },
    requireIncrease: async function (delta, withTxCost = false) {
      const realincrease = (await provider.getBalance(address)).sub(
        snapBalance
      );
      const expectedBalance = snapBalance.add(delta);
      if (!withTxCost) {
        expect(
          expectedBalance,
          `${account} should increase by ${delta} - but increased by ${realincrease}`
        ).to.eq(await provider.getBalance(address));

        // Update balance
        snapBalance = expectedBalance;
      } else {
        const expectedValues = approxCost(await provider.getBalance(address));

        expect(
          expectedBalance,
          `${account} should increase by ${delta} - but increased by ${realincrease}`
        )
          .to.gt(expectedValues[0])
          .and.lt(expectedValues[2]);

        snapBalance = expectedValues[1];
      }
    },
    requireDecrease: async function (delta, withTxCost = false) {
      const realdecrease = snapBalance.sub(await provider.getBalance(address));
      const expectedBalance = snapBalance.sub(delta);
      if (!withTxCost) {
        expect(
          snapBalance.sub(delta),
          `${account} should decrease by ${delta} - but decreased by ${realdecrease}`
        ).to.eq(await provider.getBalance(address));

        // Update balance
        snapBalance = expectedBalance;
      } else {
        const expectedValues = approxCost(await provider.getBalance(address));

        expect(
          snapBalance.sub(delta),
          `${account} should decrease by ${delta} - but decreased by ${realdecrease}`
        )
          .to.gt(expectedValues[0])
          .and.lt(expectedValues[2]);

        snapBalance = expectedValues[1];
      }
    },
    reset: async function () {
      snapBalance = await provider.getBalance(address);
    },
  };
}

module.exports = {
  balanceSnap,
  etherSnap,
};
