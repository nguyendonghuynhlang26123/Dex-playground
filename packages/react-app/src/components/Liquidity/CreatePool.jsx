import { abis, addresses } from '@dex/contracts';
import { parseUnits } from '@ethersproject/units';
import { useContractFunction, useEtherBalance, useEthers, useToken, useTokenAllowance, useTokenBalance } from '@usedapp/core';
import { BigNumber } from 'ethers';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getContract, prettyNum } from '../../common/utils';
import { useApprove } from '../../hooks';
import { ApprovalWrapper, ErrorWrapper, TransactionButton } from '../TransactionButtons';
import { LiquidityInput } from './LiquidityInput';

export const CreatePool = ({ token0Address, token1Address, navigateToLP }) => {
  const routerAddress = addresses[137].router;
  const { account, library } = useEthers();

  // Input
  const [input0, setInput0] = useState('');
  const [input1, setInput1] = useState('');

  //Token
  const token0 = useToken(token0Address);
  const token1 = useToken(token1Address);
  const token0Balance = useTokenBalance(token0Address, account);
  const token1Balance = useTokenBalance(token1Address, account);

  // Provide liquidity function
  const routerContract = getContract(abis.router, routerAddress, library);
  const { state: provideState, send: submitAddLiquidity } = useContractFunction(routerContract, 'addLiquidity', {
    transactionName: 'Provide liquidity successfully',
  });

  //State management
  const slippage = useSelector((state) => state.slippage.value);
  const { value: deadline, toSec } = useSelector((state) => state.deadline);
  const [error, setError] = useState('Enter amount');

  const provideLiquidity = useCallback(() => {
    if (!token0 || !token1) return;
    const price0 = parseUnits(input0, token0.decimals);
    const price1 = parseUnits(input1, token1.decimals);
    const amountMin0 = BigNumber.from(price0) // (100 - slippage)%
      .mul(10000 - slippage * 100)
      .div(10000);
    const amountMin1 = BigNumber.from(price1) // (100 - slippage)%
      .mul(10000 - slippage * 100)
      .div(10000);
    const dl = Math.floor(Date.now() / 1000) + deadline * toSec;
    submitAddLiquidity(token0Address, token1Address, price0, price1, amountMin0, amountMin1, account, dl);
  }, [input0, input1, slippage, deadline, toSec, submitAddLiquidity, token0Address, token1Address, token0, token1, account]);

  const handleInput0 = (ev) => {
    ev.preventDefault();
    const value = ev.target.value;
    if (isNaN(value)) return;
    setInput0(value);
  };

  const handleInput1 = (ev) => {
    ev.preventDefault();
    const value = ev.target.value;
    if (isNaN(value)) return;
    setInput1(value);
  };

  useEffect(() => {
    if (provideState.type === 'transactionSucceed') {
      navigateToLP();
    }
  }, [provideState]);

  useEffect(() => {
    if (input0 && input1 && token0 && token1) {
      const price0 = parseUnits(input0, token0.decimals);
      const price1 = parseUnits(input1, token1.decimals);
      if (price0.eq(BigNumber.from('0')) || price1.eq(BigNumber.from('0'))) setError('Enter amount');
      else if (price0.gt(token0Balance)) setError('Insufficient amount token ' + token0.symbol);
      else if (price1.gt(token1Balance)) setError('Insufficient amount token ' + token1.symbol);
      else setError(null);
    } else {
      setError('Enter amount');
    }
  }, [input0, input1, token0, token1]);

  const getRate = (amountIn, amountOut, tokenIn, tokenOut) => {
    if (!amountIn || !amountOut) return '-';
    const price0 = parseUnits(amountIn, tokenIn.decimals);
    const price1 = parseUnits(amountOut, tokenOut.decimals);
    const unit = parseUnits('1', tokenIn.decimals);
    console.log('log ~ file: CreatePool.jsx ~ line 87 ~ getRate ~ ', price0.toString(), price1.toString(), unit.toString());
    if (price1.isZero()) return '-';
    const rate = price0.mul(unit).div(price1);

    return `1 ${tokenIn.symbol} = ${prettyNum(rate, tokenOut.decimals)} ${tokenOut.symbol}`;
  };

  return token0 && token1 ? (
    <div className="w-full">
      <div className="flex flex-row gap-1">
        <LiquidityInput
          token={token0}
          balance={prettyNum(token0Balance, token0.decimals)}
          outerClass="rounded-t-none "
          inputProps={{ onChange: handleInput0, value: input0 }}
        />
        <LiquidityInput
          token={token1}
          balance={prettyNum(token1Balance, token1.decimals)}
          outerClass="rounded-t-none "
          inputProps={{ onChange: handleInput1, value: input1 }}
        />
      </div>

      {token0 && token1 && (
        <div className="my-2 mx-2 px-4 py-3 flex flex-row items-center justify-between bg-white rounded-xl shadow">
          <p>{getRate(input0, input1, token0, token1)}</p>
          <p>{getRate(input1, input0, token1, token0)}</p>
        </div>
      )}

      <div className="w-full py-2 mt-2 px-2">
        <ErrorWrapper error={error} className="w-full px-4 !m-0">
          {token0 && token1 && (
            <ApprovalWrapper tokenAddress={token0Address} target={routerAddress} className="w-full !mx-0">
              <ApprovalWrapper tokenAddress={token1Address} target={routerAddress} className="w-full !mx-0">
                <TransactionButton onClick={provideLiquidity} state={provideState} label="Create pool" className="w-full !py-3" />
              </ApprovalWrapper>
            </ApprovalWrapper>
          )}
        </ErrorWrapper>
      </div>
    </div>
  ) : (
    <>Loading...</>
  );
};
