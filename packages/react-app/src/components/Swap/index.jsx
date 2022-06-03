import { abis, addresses } from '@dex/contracts';
import { useContractFunction, useEthers } from '@usedapp/core';
import { BigNumber } from 'ethers';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { UniswapUtils } from '../../common/UniswapUtils';
import { getContract, prettyNum } from '../../common/utils';
import { useSwapInputHandle } from '../../hooks';
import { useSwap } from '../../hooks/useSwap';

import { CurrencyInput } from '../CurrencyInput';
import { CollapsePanel } from '../CollapsePanel';
import { BiDownArrowAlt, BiInfoCircle } from 'react-icons/bi';
import { ApprovalWrapper, ErrorWrapper, TransactionButton } from '../TransactionButtons';
const FEE_PERCENT = 3; // 0.3
export const Swap = () => {
  const { library, account } = useEthers();

  // Contract
  const routerContract = getContract(abis.router, addresses[4].router, library);

  // Manage all address mapping && liquidity
  const [[address0, address1], setTokenAddresses] = useState([null, null]);
  const [[token0, setAddress0], [token1, setAddress1], [r0, r1], swapError] = useSwap(addresses[4].factory);
  const { price0, price1, token0InputProps, token1InputProps, exchangePrice, swapBy, reset } = useSwapInputHandle({ r0: r0, r1: r1 });

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
    if (swapError) {
      setError(swapError);
    } else if (price0 && price1 && token0 && r1) {
      if (price0.isZero() || price1.isZero()) setError('Input invalid ');
      else if (price0.gt(token0.balance)) setError("Insufficient user's balance");
      else if (price1.gt(r1)) setError('Insufficient liquidity');
      else setError(null);
    }
  }, [price0, price1, r1, token0, swapError]);

  const reverseInput = useCallback(() => {
    setAddress0(address1);
    setAddress1(address0);
    setTokenAddresses((prv) => [prv[1], prv[0]]);
  }, [address0, address1]);

  const handleAddressChange = useCallback(
    (address, isInput) => {
      if (isInput) {
        setAddress0(address);

        if (address === address1) {
          setAddress1(null);
          setTokenAddresses((prv) => [address, null]);
        } else setTokenAddresses((prv) => [address, prv[1]]);
      } else {
        setAddress1(address);
        if (address === address0) {
          setAddress0(null);
          setTokenAddresses([null, address]);
        } else setTokenAddresses((prv) => [prv[0], address]);
      }
    },
    [address0, address1]
  );

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

  const performSwap = useCallback(() => {
    if (swapBy === 0) {
      // Swap by Input
      const amountIn = price0;
      const amountOutMin = BigNumber.from(price1) // (100 - X)% desired output
        .mul(10000 - slippage * 100)
        .div(10000);
      const dl = Math.floor(Date.now() / 1000) + deadline * toSec;
      swapWithInput(amountIn, amountOutMin, [token0.address, token1.address], account, dl);
    } else if (swapBy === 1) {
      //Swap by output
      const amountOut = price1;
      const amountInMax = BigNumber.from(price0)
        .mul(10000 + slippage * 100)
        .div(10000);
      const dl = Math.floor(Date.now() / 1000) + deadline * toSec;
      swapWithOutput(amountOut, amountInMax, [token0.address, token1.address], account, dl);
    } else toast.warn('Enter amount before swap');
  }, [account, price0, price1, swapBy, swapWithInput, swapWithOutput, token0, token1, slippage, deadline, toSec]);

  return (
    <div>
      <form className="flex flex-col pt-4">
        <div className="my-2">
          <CurrencyInput
            label="From:"
            provider={library}
            account={account}
            tokenAddress={address0}
            onAddressChange={(address) => handleAddressChange(address, true)}
            inputProps={token0InputProps}
          />
          <span className="w-full flex justify-center items-center h-1">
            <BiDownArrowAlt
              className="w-7 h-7 bg-white rounded-[1rem] text-gray-400 border-4 border-sky-100 absolute text-md cursor-pointer hover:bg-sky-100 "
              onClick={reverseInput}
            />
          </span>
          <CurrencyInput
            label="To:"
            provider={library}
            account={account}
            tokenAddress={address1}
            onAddressChange={(address) => handleAddressChange(address, false)}
            inputProps={token1InputProps}
          />
        </div>

        {exchangePrice && token0 && token1 ? (
          <CollapsePanel
            title={
              <div className="flex items-center gap-1">
                <BiInfoCircle />
                <span className="text-md tracking-tight">
                  1 {token0.symbol} = {exchangePrice} {token1.symbol}
                </span>
              </div>
            }
          >
            {price0 && price1 && r0 && r1 && (
              <div className="px-2">
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
          </CollapsePanel>
        ) : null}

        <ErrorWrapper error={error}>
          {token0 && (
            <ApprovalWrapper tokenAddress={token0.address} target={addresses[4].router}>
              <TransactionButton className="my-2 mx-2.5 !py-3 !rounded-[1rem]" label="Swap" onClick={performSwap} state={swapState} />
            </ApprovalWrapper>
          )}
        </ErrorWrapper>
      </form>
    </div>
  );
};
