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
import { UniswapUtils } from '../../common/UniswapUtils';
import { getContract, prettyNum } from '../../common/utils';
import { useApprove, useLiquidityReserve, useSwapInputHandle } from '../../hooks';
import { TransactionButton } from '../common';
import Curve from '../Curve';

const DEFAULT_SLIPPAGE = envConfig.slippage;
const DEFAULT_DEADLINE = envConfig.deadline;
const FEE_PERCENT = 3; // 0.3
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

  // Pool state management
  const [error, setError] = useState(null);
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [deadline, setDeadline] = useState(DEFAULT_DEADLINE);

  useEffect(() => {
    if (price0 && price1 && r0 && r1) {
      if (price0.gt(r0)) setError("Insufficient user's balance");
      else if (price1.gt(r1)) setError('Insufficient liquidity');
      else setError(null);
    }
  }, [price0, price1, r0, r1]);

  const onApprove = (ev) => {
    ev.preventDefault();
    approveToken();
  };

  const onChangeSlippage = (ev) => setSlippage(ev.target.value);
  const onChangeDeadline = (ev) => setDeadline(ev.target.value);

  const calculateFee = (value) => {
    return value.mul(FEE_PERCENT).div(1000);
  };

  const calculatePriceImpact = (value0, value1, reserve0, reserve1) => {
    return UniswapUtils.calculatePriceImpact(value0, value1, reserve0, reserve1).round(2).toString();
  };

  const calculatePriceSlippage = (swapByInput, price, slippage) => {
    let result;
    if (swapByInput)
      result = BigNumber.from(price) // (100 - X)% desired output
        .mul(10000 - slippage * 100)
        .div(10000);
    else
      result = BigNumber.from(price)
        .mul(10000 + slippage * 100)
        .div(10000);
    return prettyNum(result);
  };

  const performSwap = useCallback(
    (ev) => {
      ev.preventDefault();
      if (swapBy === 0) {
        // Swap by Input
        const amountIn = price0;
        const amountOutMin = BigNumber.from(price1) // (100 - X)% desired output
          .mul(10000 - slippage * 100)
          .div(10000);
        const dl = Math.floor(Date.now() / 1000) + deadline * 60000;
        swapWithInput(amountIn, amountOutMin, [token0Address, token1Address], account, dl);
      } else if (swapBy === 1) {
        //Swap by outpu
        const amountOut = parseEther(price1);
        const amountInMax = BigNumber.from(price0)
          .mul(10000 + slippage * 100)
          .div(10000);
        const dl = Math.floor(Date.now() / 1000) + deadline * 60000;
        swapWithOutput(amountOut, amountInMax, [token0Address, token1Address], account, dl);
      } else toast.warn('Enter amount before swap');
    },
    [account, price0, price1, swapBy, swapWithInput, swapWithOutput, token0Address, token1Address, slippage, deadline]
  );

  return active && token0 && token1 ? (
    <>
      <Curve
        title0="ONE"
        title1="TWO"
        r0={Number(prettyNum(r0))}
        r1={Number(prettyNum(r1))}
        addToken0={price0 ? Number(prettyNum(price0)) : 0}
        addToken1={0}
        width={500}
        height={500}
      />
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
        <div>
          <details className="open:bg-gray-100  open:ring-1 open:ring-black/5 open:shadow-lg p-6 rounded-lg " open>
            <summary className="text-gray-800 hover:underline hover:cursor-pointer py-1">
              {exchangePrice && (
                <>
                  1 {token0.symbol} = {exchangePrice} {token1.symbol}
                </>
              )}
            </summary>
            <p className="">
              Slippage: <input className="inline w-16" onChange={onChangeSlippage} type="number" value={slippage} />% -
              Deadline: <input className="inline w-16" type="number" onChange={onChangeDeadline} value={deadline} />
              {' minutes'}
            </p>
            <hr className="my-2" />
            {price0 && price1 && (
              <div>
                <div className="flex flex-row justify-between">
                  <p>Uniswap fee</p>
                  <span>
                    {prettyNum(calculateFee(price0))} {token0.symbol}
                  </span>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Expected received</p>
                  <span>
                    {prettyNum(price1)} {token1.symbol}
                  </span>
                </div>
                <div className="flex flex-row justify-between">
                  <p>Price Impact</p>
                  <span>-{calculatePriceImpact(price0, price1, r0, r1)}%</span>
                </div>
                {swapBy === 0 ? (
                  <div className="flex flex-row justify-between border-t border-gray-500 mt-1">
                    <p className="italic ">Minimum received after slippage ({slippage}%)</p>
                    <span>
                      {calculatePriceSlippage(swapBy === 0, price1, slippage)} {token1.symbol}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-row justify-between border-t border-gray-500 mt-1">
                    <p className="italic ">Maximum sent after slippage ({slippage}%)</p>
                    <span>
                      {calculatePriceSlippage(swapBy === 1, price0, slippage)} {token0.symbol}
                    </span>
                  </div>
                )}
              </div>
            )}
          </details>
        </div>
        {allowance && allowance.isZero() && (
          <TransactionButton
            label={`Approve ${token0.symbol}`}
            onClick={onApprove}
            state={approvalState}
            className={`mt-2 !bg-white !text-blue-500 border border-blue-500 hover:!bg-blue-300 hover:!border-blue-300 hover:!text-white`}
          />
        )}
        {error ? (
          <button
            className={`bg-red-500 text-white ease-in-out duration-300 rounded px-2 py-1.5 my-2 disabled:opacity-60`}
            disabled
          >
            {error}
          </button>
        ) : (
          <TransactionButton className="my-2" label="Swap" onClick={performSwap} state={swapState} />
        )}
      </form>
    </>
  ) : (
    <p>Loading...</p>
  );
};
