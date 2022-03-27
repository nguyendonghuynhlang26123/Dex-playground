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

export const Swap = ({ token1Address, token2Address, swapPosition }) => {
  const { library, account } = useEthers();
  //Token info
  const token1 = useToken(token1Address);
  const token2 = useToken(token2Address);
  const token1Balance = useTokenBalance(token1Address, account);
  const token2Balance = useTokenBalance(token2Address, account);

  //Token allowance must be approved before swap
  const allowance = useTokenAllowance(token1Address, account, addresses[4].pair);
  const { state: approvalState, send: approveToken } = useContractFunction(
    getContract(abis.erc20, token1Address),
    'approve',
    {
      transactionName: `Token Approved`,
    }
  );

  //Liquidity
  const { active, r0, r1 } = useLiquidityReserve(addresses[4].pair);

  //Swapping states
  const routerContract = getContract(abis.router, addresses[4].router, library);
  const [[input1, input2], setInput] = useState(['', '']);
  const [[output1, output2], setOutput] = useState(['', '']);
  const debouncedValue1 = useDebounce(input1, 1000);
  const debouncedValue2 = useDebounce(input2, 1000);
  const [exchangePrice, setExchangePrice] = useState(0);

  const useSwapHook = (method) => useContractFunction(routerContract, method, { transactionName: 'Swap successfully' });
  const { state: inputSwapState, send: swapWithInput } = useSwapHook('swapExactTokensForTokens');
  const { state: outputSwapState, send: swapWithOutput } = useSwapHook('swapTokensForExactTokens');
  const swapState = useMemo(() => {
    if (inputSwapState.status !== 'None') return inputSwapState;
    if (outputSwapState.status !== 'None') return inputSwapState;
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
    if (debouncedValue1 && !isNaN(debouncedValue1)) {
      getAmountOut(debouncedValue1).then((data) => {
        setInput((prv) => [prv[0], '']);
        setOutput((prvState) => [prvState[0], data.toString()]);
      });
    }
  }, [debouncedValue1, r0, r1]);

  useEffect(() => {
    if (debouncedValue2 && !isNaN(debouncedValue2)) {
      getAmountIn(debouncedValue2).then((data) => {
        setInput((prv) => ['', prv[1]]);
        setOutput((prvState) => [data.toString(), prvState[1]]);
      });
    }
  }, [debouncedValue2, r0, r1]);

  useEffect(() => {
    if (r0 && r1 && token1 && token2)
      getAmountOut(1).then((value) =>
        setExchangePrice(`1 ${token1.symbol} = ${prettyNum(value, token2.decimals)} ${token2.symbol}`)
      );
  }, [r0, r1, token1, token2, getAmountOut]);

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
      if (input1) {
        const amountIn = parseEther(input1);
        const amountOutMin = BigNumber.from(output2)
          .mul(100 - envConfig.slippage)
          .div(100);
        const deadline = Math.floor(Date.now() / 1000) + envConfig.deadline;
        swapWithInput(amountIn, amountOutMin, [token1Address, token2Address], account, deadline);
      } else if (input2) swapWithOutput(formatEther(input2), r0, r1);
      else toast.warn('Enter amount before swap');
    },
    [input1, input2, output1, output2, r0, r1]
  );

  return active && token1 && token2 ? (
    <form className="flex flex-col ">
      <h1 className="text-[32px] text-center mt-6 mb-2 font-bold">SWAP</h1>

      <div className="flex flex-row space-x-2 my-2 ">
        <label className="w-40">
          {token1.name} ({token1.symbol}):
          <br />
          Balance: {token1Balance && prettyNum(token1Balance, token1.decimals)}
        </label>
        <input
          className="border border-gray-400 rounded flex-grow px-2 py-1"
          value={output1 ? prettyNum(output1, 18) : input1}
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
          {token2.name} ({token2.symbol}) <br />
          Balance: {token2Balance && prettyNum(token2Balance, token2.decimals)}
        </label>
        <input
          className="border border-gray-400 rounded flex-grow px-2 py-1"
          value={output2 ? prettyNum(output2, 18) : input2}
          onChange={token2InputHandle}
        />
      </div>
      <p className="text-gray-600 text-center">{exchangePrice}</p>
      <p className="text-center ">
        Slippage: {envConfig.slippage}% - Deadline: {envConfig.deadline / 60} minutes
      </p>
      {allowance && allowance.isZero() && (
        <TransactionButton
          label={`Approve ${token1.symbol}`}
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
