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
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { envConfig } from '../../common/config';
import { UniswapUtils } from '../../common/UniswapUtils';
import { getContract, prettyNum } from '../../common/utils';
import { useApprove, useLiquidityReserve, useSwapInputHandle } from '../../hooks';
import { TransactionButton } from '../common';
import Curve from '../Curve';
import './index.css'

const FEE_PERCENT = 3; // 0.3
export const Protocol = ({ token0Address, token1Address, swapPosition }) => {
    const { library, account } = useEthers();
    const poolAddress = addresses[4].pair;
    const routerAddress = addresses[4].router;
  
    //Token info
    const token0 = useToken(token0Address);
    const token1 = useToken(token1Address);
    const token0Balance = useTokenBalance(token0Address, account);
    const token1Balance = useTokenBalance(token1Address, account);
  
    //User must approve the router to spend their money before transfer
    const allowance = useTokenAllowance(token0Address, account, routerAddress);
    const [approvalState, approveToken] = useApprove(token0Address, routerAddress, 'Token Approved');
  
    //Liquidity
    const { active, r0, r1 } = useLiquidityReserve(poolAddress, token0Address, token1Address);
  
    //Input handler
    const routerContract = getContract(abis.router, routerAddress, library);
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
      if (swapBy === 0) return inputSwapState;
      else return outputSwapState;
    }, [swapBy, inputSwapState, outputSwapState]);
  
    // Pool state management
    const [error, setError] = useState('Enter amount');
    const slippage = useSelector((state) => state.slippage.value);
    const { value: deadline, toSec } = useSelector((state) => state.deadline);
  
    useEffect(() => {
      if (price0 && price1 && token0Balance && r1) {
        if (price0.isZero() || price1.isZero()) setError('Input invalid ');
        else if (price0.gt(token0Balance)) setError("Insufficient user's balance");
        else if (price1.gt(r1)) setError('Insufficient liquidity');
        else setError(null);
      }
    }, [price0, price1, r1, token0Balance]);
  
    const onApprove = (ev) => {
      ev.preventDefault();
      approveToken();
    };
  
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
          const dl = Math.floor(Date.now() / 1000) + deadline * toSec;
          swapWithInput(amountIn, amountOutMin, [token0Address, token1Address], account, dl);
        } else if (swapBy === 1) {
          //Swap by output
          const amountOut = price1;
          const amountInMax = BigNumber.from(price0)
            .mul(10000 + slippage * 100)
            .div(10000);
          const dl = Math.floor(Date.now() / 1000) + deadline * toSec;
          swapWithOutput(amountOut, amountInMax, [token0Address, token1Address], account, dl);
        } else toast.warn('Enter amount before swap');
      },
      [
        account,
        price0,
        price1,
        swapBy,
        swapWithInput,
        swapWithOutput,
        token0Address,
        token1Address,
        slippage,
        deadline,
        toSec,
      ]
    );
   
  
    return active && token0 && token1 ? (
      <>
        <form className="tag" >
            <h1 className="font-bold text-[32px] ">Limit order</h1>
            
            <div className="labelBox flex flex-row space-x-2 my-2 ">
          <label className="w-40">
            {token0.name} ({token0.symbol}):
            <br />
            Balance: {token0Balance && prettyNum(token0Balance, token0.decimals)}
          </label>
          <input {...token0InputProps} className="inputBox   rounded flex-grow px-2 py-1" />
        </div>
        <button
          className="rounded-full border border-gray-300 hover:bg-gray-200 w-6 h-6 flex justify-center items-center ml-auto"
          onClick={swapPosition}
        >
          <RiArrowUpDownLine />
        </button>
        <div className=" labelBox flex flex-row space-x-2 my-2 ">
          <label className="w-40">
            Price
          </label>
          <input {...token1InputProps} className="inputBox  rounded flex-grow px-2 py-1" />
        </div>  
        <div className="labelBox flex flex-row space-x-2 my-2 ">
          <label className="w-40">
            {token1.name} ({token1.symbol}) <br />
            Balance: {token1Balance && prettyNum(token1Balance, token1.decimals)}
          </label>
          <input {...token1InputProps} className="inputBox rounded flex-grow px-2 py-1" />
        </div>    
        <label className=" text-gray-800 hover:underline hover:cursor-pointer py-1 text-[8px] ">
              {exchangePrice && (
                <>
                  1 {token0.symbol} = {exchangePrice} {token1.symbol}
                </>
              )}
            </label>
        <div>
        <button className="btnSetLimit">Set limit</button>
            
        </div>
        
        </form>
       
      </>
    ) : (
      <p>Loading...</p>
    );
  };
  