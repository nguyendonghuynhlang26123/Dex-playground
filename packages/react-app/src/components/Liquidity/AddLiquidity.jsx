import { abis, addresses } from '@dex/contracts';
import { useContractFunction, useEthers, useTokenAllowance } from '@usedapp/core';
import { BigNumber } from 'ethers';
import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { UniswapUtils } from '../../common/UniswapUtils';
import { getContract, prettyNum } from '../../common/utils';
import { useApprove } from '../../hooks';
import { useLiquidityInputHandle } from '../../hooks/useLiquidityInputHandle';
import { TransactionButton } from '../TransactionButtons';

export const AddLiquidity = ({ token0, token1, token0Address, token1Address, token0Balance, token1Balance, r0, r1, totalLPToken }) => {
  const { account, library } = useEthers();
  const routerAddress = addresses[137].router;

  //Input handle
  const { price0, price1, token0InputProps, token1InputProps } = useLiquidityInputHandle({ r0, r1, token0, token1 });

  //Token Approval:
  const token0Allowance = useTokenAllowance(token0Address, account, routerAddress);
  const token1Allowance = useTokenAllowance(token1Address, account, routerAddress);
  const [approval0State, approveToken0] = useApprove(token0Address, routerAddress, 'Token Approved');
  const [approval1State, approveToken1] = useApprove(token1Address, routerAddress, 'Token Approved');

  // Provide liquidity function
  const routerContract = getContract(abis.router, routerAddress, library);
  const { state: provideState, send: submitAddLiquidity } = useContractFunction(routerContract, 'addLiquidity', {
    transactionName: 'Provide liquidity successfully',
  });

  //State management
  const slippage = useSelector((state) => state.slippage.value);
  const { value: deadline, toSec } = useSelector((state) => state.deadline);
  const [error, setError] = useState('Enter amount');

  useEffect(() => {
    if (price0 && price1 && token0Balance && token1Balance && token0 && token1 && token1Allowance && token0Allowance) {
      if (price0.isZero() || price1.isZero()) setError('Invalid input');
      else if (price0.gt(token0Balance)) setError('Insufficient ' + token0.symbol);
      else if (price1.gt(token1Balance)) setError('Insufficient ' + token1.symbol);
      else if (token1Allowance.isZero() || token0Allowance.isZero()) setError('Token must be approved');
      else setError(null);
    }
  }, [price0, price1, token0Balance, token1Balance, token0, token1, token0Allowance, token1Allowance]);

  const percentShareExpected = useCallback(
    (deposit) => {
      return UniswapUtils.percentShareExpect(deposit, r0, totalLPToken).round(2).toString();
    },
    [totalLPToken, r0]
  );

  const provideLiquidity = useCallback(() => {
    const amountDesired0 = price0;
    const amountDesired1 = price1;
    const amountMin0 = BigNumber.from(price0) // (100 - slippage)%
      .mul(10000 - slippage * 100)
      .div(10000);
    const amountMin1 = BigNumber.from(price1) // (100 - slippage)%
      .mul(10000 - slippage * 100)
      .div(10000);
    const dl = Math.floor(Date.now() / 1000) + deadline * toSec;
    submitAddLiquidity(token0Address, token1Address, amountDesired0, amountDesired1, amountMin0, amountMin1, account, dl);
  }, [price0, price1, slippage, deadline, toSec, submitAddLiquidity, token0Address, token1Address, account]);

  return (
    <div className="w-full">
      <div className="grid gap-x-4 grid-cols-2 w-full  items-center mt-2">
        <p>
          {token0.symbol} (Balance: {prettyNum(token0Balance, token0.decimals)})
        </p>
        <p>
          {token1.symbol} (Balance: {prettyNum(token1Balance, token1.decimals)})
        </p>
        <input {...token0InputProps} id="0" className="ml-0 border border-gray-300 rounded px-2 py-1 my-0.5" />
        <input {...token1InputProps} id="1" className="border border-gray-300 rounded px-2 py-1 my-0.5" />
      </div>
      {price0 && (
        <p className="text-center">
          <b>{percentShareExpected(price0)}</b> % Share of Pool
        </p>
      )}
      <div className="flex flex-row space-x-2">
        {token0Allowance && token0Allowance.isZero() && (
          <TransactionButton
            label={`Approve ${token0.symbol}`}
            onClick={() => approveToken0()}
            state={approval0State}
            className={`mt-2 flex-1 !bg-white !text-blue-500 border border-blue-500 hover:!bg-blue-300 hover:!border-blue-300 hover:!text-white`}
          />
        )}
        {token1Allowance && token1Allowance.isZero() && (
          <TransactionButton
            label={`Approve ${token1.symbol}`}
            onClick={() => approveToken1()}
            state={approval1State}
            className={`mt-2 flex-1 !bg-white !text-blue-500 border border-blue-500 hover:!bg-blue-300 hover:!border-blue-300 hover:!text-white`}
          />
        )}
      </div>
      {error ? (
        <button className={`bg-red-500 text-white ease-in-out duration-300 rounded px-2 py-1.5 my-2 disabled:opacity-60 w-full`} disabled>
          {error}
        </button>
      ) : (
        <TransactionButton onClick={provideLiquidity} className="mt-2 w-full" state={provideState} label="Supply" />
      )}
    </div>
  );
};
