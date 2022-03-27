import { abis, addresses } from '@dex/contracts';
import { formatEther, parseEther } from '@ethersproject/units';
import {
  ERC20Interface,
  useContractFunction,
  useDebounce,
  useEthers,
  useToken,
  useTokenAllowance,
  useTokenBalance,
} from '@usedapp/core';
import { BigNumber, constants } from 'ethers';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RiArrowUpDownLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { envConfig } from '../../common/config';
import { getContract, prettyNum } from '../../common/utils';
import { useLiquidityReserve } from '../../hooks';
import { TransactionButton } from '../common';

export const Swap = ({ token0Address, token1Address, swapPosition }) => {
  const { library, account } = useEthers();
  //Token info
  const token0 = useToken(token0Address);
  const token1 = useToken(token1Address);
  const token1Balance = useTokenBalance(token0Address, account);
  const token2Balance = useTokenBalance(token1Address, account);

  //Token allowance must be approved before swap
  const allowance = useTokenAllowance(token0Address, account, addresses[4].pair);
  const { state: approvalState, send: approveToken } = useContractFunction(
    getContract(abis.erc20, token0Address),
    'approve',
    {
      transactionName: `Token Approved`,
    }
  );

  //Liquidity
  const { active, r0, r1 } = useLiquidityReserve(addresses[4].pair, token0Address, token1Address);

  //Swapping states
  const routerContract = getContract(abis.router, addresses[4].router, library);
  const [[input0, input1], setInput] = useState(['', '']);
  const [[output0, output1], setOutput] = useState(['', '']);
  const debouncedValue0 = useDebounce(input0, 1000);
  const debouncedValue1 = useDebounce(input1, 1000);
  const [exchangePrice, setExchangePrice] = useState(0);

  const useSwapHook = (method) => useContractFunction(routerContract, method, { transactionName: 'Swap successfully' });
  const { state: inputSwapState, send: swapWithInput } = useSwapHook('swapExactTokensForTokens');
  const { state: outputSwapState, send: swapWithOutput } = useSwapHook('swapTokensForExactTokens');
  const swapState = useMemo(() => {
    if (inputSwapState.status !== 'None') return inputSwapState;
    if (outputSwapState.status !== 'None') return outputSwapState;
    return inputSwapState;
  }, [inputSwapState, outputSwapState]);

  const getAmountIn = useCallback(
    async (amountOut) => {
      if (r0 && r1) {
        return await routerContract.getAmountIn(parseEther(amountOut.toString()), r0, r1);
      }
    },
    [r0, r1, routerContract]
  );
  const getAmountOut = useCallback(
    async (amountIn) => {
      if (r0 && r1) {
        return await routerContract.getAmountOut(parseEther(amountIn.toString()), r0, r1);
      }
      return undefined;
    },
    [r0, r1, routerContract]
  );

  useEffect(() => {
    if (debouncedValue0 && !isNaN(debouncedValue0)) {
      getAmountOut(debouncedValue0).then((data) => {
        setInput((prv) => [prv[0], '']);
        setOutput((prvState) => [prvState[0], data.toString()]);
      });
    }
  }, [debouncedValue0, r0, r1]);

  useEffect(() => {
    if (debouncedValue1 && !isNaN(debouncedValue1)) {
      getAmountIn(debouncedValue1).then((data) => {
        setInput((prv) => ['', prv[1]]);
        setOutput((prvState) => [data.toString(), prvState[1]]);
      });
    }
  }, [debouncedValue1, r0, r1]);

  useEffect(() => {
    if (r0 && r1 && token0 && token1)
      getAmountOut(1).then((value) =>
        setExchangePrice(`1 ${token0.symbol} = ${prettyNum(value, token1.decimals)} ${token1.symbol}`)
      );
  }, [r0, r1, token0, token1, getAmountOut]);

  const token1InputHandle = (ev) => {
    setInput((prvState) => [ev.target.value, prvState[1]]);
    setOutput(['', '']);
  };

  const token2InputHandle = (ev) => {
    setInput((prvState) => [prvState[0], ev.target.value]);
    setOutput(['', '']);
  };

  const onApprove = (ev) => {
    ev.preventDefault();
    approveToken(addresses[4].pair, constants.MaxInt256);
  };

  const performSwap = useCallback(
    (ev) => {
      ev.preventDefault();
      if (input0) {
        const amountIn = parseEther(input0);
        const amountOutMin = BigNumber.from(output1)
          .mul(100 - envConfig.slippage)
          .div(100);
        const deadline = Math.floor(Date.now() / 1000) + envConfig.deadline;
        swapWithInput(amountIn, amountOutMin, [token0Address, token1Address], account, deadline);
      } else if (input1) {
        const amountOut = parseEther(input1);
        const amountInMax = BigNumber.from(output0)
          .mul(100 + envConfig.slippage)
          .div(100);
        const deadline = Math.floor(Date.now() / 1000) + envConfig.deadline;
        swapWithOutput(amountOut, amountInMax, [token0Address, token1Address], account, deadline);
      } else toast.warn('Enter amount before swap');
    },
    [account, input0, input1, output0, output1, swapWithInput, swapWithOutput, token0Address, token1Address]
  );

  return active && token0 && token1 ? (
    <form className="flex flex-col ">
      <h1 className="text-[32px] text-center mt-6 mb-2 font-bold">SWAP</h1>

      <div className="flex flex-row space-x-2 my-2 ">
        <label className="w-40">
          {token0.name} ({token0.symbol}):
          <br />
          Balance: {token1Balance && prettyNum(token1Balance, token0.decimals)}
        </label>
        <input
          className="border border-gray-400 rounded flex-grow px-2 py-1"
          value={output0 ? prettyNum(output0, 18) : input0}
          onChange={token1InputHandle}
        />
      </div>
      <button
        className="rounded-full border border-gray-300 hover:bg-gray-200 w-6 h-6 flex justify-center items-center ml-auto"
        onClick={swapPosition}
      >
        <RiArrowUpDownLine />
      </button>
      <div className="flex flex-row space-x-2 my-2 ">
        <label className="w-40">
          {token1.name} ({token1.symbol}) <br />
          Balance: {token2Balance && prettyNum(token2Balance, token1.decimals)}
        </label>
        <input
          className="border border-gray-400 rounded flex-grow px-2 py-1"
          value={output1 ? prettyNum(output1, 18) : input1}
          onChange={token2InputHandle}
        />
      </div>
      <p className="text-gray-600 text-center">{exchangePrice}</p>
      <p className="text-center ">
        Slippage: {envConfig.slippage}% - Deadline: {envConfig.deadline / 60} minutes
      </p>
      {allowance && allowance.isZero() && (
        <TransactionButton
          label={`Approve ${token0.symbol}`}
          onClick={onApprove}
          state={approvalState}
          className={`mt-2 !bg-white !text-blue-500 border border-blue-500 hover:!bg-blue-300 hover:!border-blue-300 hover:!text-white`}
        />
      )}
      <TransactionButton className="my-2" label="Swap" onClick={performSwap} state={swapState} />
    </form>
  ) : (
    <p>Loading...</p>
  );
};
