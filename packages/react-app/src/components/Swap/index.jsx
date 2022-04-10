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
import { useApprove, useLiquidityReserve, useSwapInputHandle } from '../../hooks';
import { TransactionButton } from '../common';

const SLIPPAGE = envConfig.slippage;
const DEADLINE = envConfig.deadline;
export const Swap = ({ token0Address, token1Address, swapPosition }) => {
  const { library, account } = useEthers();
  const poolAddress = addresses[4].pair;

  //Token info
  const token0 = useToken(token0Address);
  const token1 = useToken(token1Address);
  const token1Balance = useTokenBalance(token0Address, account);
  const token2Balance = useTokenBalance(token1Address, account);

  //Token allowance must be approved before swap
  const allowance = useTokenAllowance(token0Address, account, poolAddress);
  const { state: approvalState, approveToken } = useApprove(token0Address, poolAddress, 'Token Approved');

  //Liquidity
  const { active, r0, r1 } = useLiquidityReserve(poolAddress, token0Address, token1Address);

  //Input handler
  const routerContract = getContract(abis.router, addresses[4].router, library);
  const { price0, price1, token0InputProps, token1InputProps, exchangePrice, swapBy } = useSwapInputHandle({
    r0,
    r1,
    routerContract,
    debounceTime: 100,
  });

  //Swap functions
  const useSwapHook = (method) => useContractFunction(routerContract, method, { transactionName: 'Swap successfully' });
  const { state: inputSwapState, send: swapWithInput } = useSwapHook('swapExactTokensForTokens');
  const { state: outputSwapState, send: swapWithOutput } = useSwapHook('swapTokensForExactTokens');
  const swapState = useMemo(() => {
    if (inputSwapState.status !== 'None') return inputSwapState;
    if (outputSwapState.status !== 'None') return outputSwapState;
    return inputSwapState;
  }, [inputSwapState, outputSwapState]);

  const onApprove = (ev) => {
    ev.preventDefault();
    approveToken();
  };

  const performSwap = useCallback(
    (ev) => {
      ev.preventDefault();
      if (swapBy === 0) {
        // Swap by Input
        const amountIn = price0;
        const amountOutMin = BigNumber.from(price1) // (100 - X)% desired output
          .mul(100 - SLIPPAGE)
          .div(100);
        const deadline = Math.floor(Date.now() / 1000) + envConfig.deadline;
        swapWithInput(amountIn, amountOutMin, [token0Address, token1Address], account, deadline);
      } else if (swapBy === 1) {
        //Swap by outpu
        const amountOut = parseEther(price1);
        const amountInMax = BigNumber.from(price0)
          .mul(100 + SLIPPAGE)
          .div(100);
        const deadline = Math.floor(Date.now() / 1000) + DEADLINE;
        swapWithOutput(amountOut, amountInMax, [token0Address, token1Address], account, deadline);
      } else toast.warn('Enter amount before swap');
    },
    [account, price0, price1, swapBy, swapWithInput, swapWithOutput, token0Address, token1Address]
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
        <input {...token0InputProps} className="border border-gray-400 rounded flex-grow px-2 py-1" />
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
        <input {...token1InputProps} className="border border-gray-400 rounded flex-grow px-2 py-1" />
      </div>
      {exchangePrice && (
        <p className="text-gray-600 text-center">
          1 {token0.symbol} = {exchangePrice} {token1.symbol}
        </p>
      )}
      <p className="text-center ">
        Slippage: {SLIPPAGE}% - Deadline: {DEADLINE / 60} minutes
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
