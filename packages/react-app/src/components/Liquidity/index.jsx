import { abis, addresses } from '@dex/contracts';
import React, { useCallback, useState, useEffect } from 'react';
import { useApprove, useLiquidityReserve } from '../../hooks';
import { useContractFunction, useEthers, useToken, useTokenAllowance, useTokenBalance } from '@usedapp/core';
import { FixedNumber } from 'ethers';
import { UniswapUtils } from '../../common/UniswapUtils';
import { getContract, prettyNum } from '../../common/utils';
import { useLiquidityInputHandle } from '../../hooks/useLiquidityInputHandle';
import { TransactionButton } from '../common';

export const Liquidity = ({ token0Address, token1Address, pairAddress }) => {
  const { account, library } = useEthers();
  const routerAddress = addresses[4].router;

  //Liquidity
  const { active, r0, r1 } = useLiquidityReserve(pairAddress, token0Address, token1Address);
  const { price0, price1, token0InputProps, token1InputProps } = useLiquidityInputHandle({ r0, r1 });

  //Liquidity token
  const mintedLiquidity = useTokenBalance(pairAddress, account);
  const { totalSupply } = useToken(pairAddress) ?? {};

  //Token
  const token0 = useToken(token0Address);
  const token1 = useToken(token1Address);
  const token0Balance = useTokenBalance(token0Address, account);
  const token1Balance = useTokenBalance(token1Address, account);

  //Token Approval:
  const token0Allowance = useTokenAllowance(token0Address, account, routerAddress);
  const token1Allowance = useTokenAllowance(token1Address, account, routerAddress);
  const { state: approval0State, approveToken0 } = useApprove(token0Address, routerAddress, 'Token Approved');
  const { state: approval1State, approveToken1 } = useApprove(token1Address, routerAddress, 'Token Approved');

  // Provide liquidity function
  const routerContract = getContract(abis.router, routerAddress, library);
  const { state: provideState, send: submitProvision } = useContractFunction(routerContract, 'addLiquidity', {
    transactionName: 'Provide liquidity successfully',
  });

  //State management
  const [error, setError] = useState(null);

  useEffect(() => {
    if (price0 && price1 && token0Balance && token1Balance && token0 && token1) {
      if (price0.gt(token0Balance)) setError('Insufficient ' + token0.symbol);
      else if (price1.gt(token1Balance)) setError('Insufficient ' + token1.symbol);
      else setError(null);
    }
  }, [price0, price1, token0Balance, token1Balance, token0, token1]);

  const calculateShare = (minted, total) => {
    return FixedNumber.from(minted.mul(100)).divUnsafe(FixedNumber.from(total)).ceiling(); //Ceil up ?;
  };

  const provideLiquidity = () => {};

  const percentShareExpected = useCallback(
    (deposit) => {
      return UniswapUtils.percentShareExpect(deposit, r0, totalSupply).round(2).toString();
    },
    [totalSupply, r0]
  );

  return active && token0 && token1 && mintedLiquidity ? (
    <div className="flex flex-col my-2">
      <h1 className="text-[32px] text-center mt-4 mb-2 font-bold">Liquidity</h1>

      <div className="flex flex-row w-full divide-x space-x-2">
        <p className="flex-1 p-2">
          <b>Pool {token0.symbol}</b>
          <br /> {prettyNum(r0, 18)}
        </p>
        <p className="flex-1 p-2">
          <b>Pool {token1.symbol}</b>
          <br /> {prettyNum(r1, 18)}
        </p>
      </div>

      <hr className="w-32 mx-auto my-2 border-gray-500" />
      {totalSupply && (
        <>
          <p>
            <b>Your liquidity token: </b>
            {prettyNum(mintedLiquidity, 18)} / {prettyNum(totalSupply, 18)}
          </p>
          <p>
            <b>% share: </b>
            {calculateShare(mintedLiquidity, totalSupply).toString() + '%'}{' '}
          </p>
        </>
      )}

      <p className="font-bold mt-4 ">Add liquidity</p>
      <div className="grid gap-x-4 grid-cols-2 w-full  items-center mt-2">
        <p>
          {token0.symbol} (Max: {prettyNum(token0Balance)})
        </p>
        <p>
          {token1.symbol} (Max: {prettyNum(token1Balance)})
        </p>
        <input {...token0InputProps} id="0" className="ml-0 border border-gray-300 rounded px-2 py-1 my-0.5" />
        <input {...token1InputProps} id="1" className="border border-gray-300 rounded px-2 py-1 my-0.5" />
        {token0Allowance && token0Allowance.isZero() && (
          <TransactionButton
            label={`Approve ${token0.symbol}`}
            onClick={() => approveToken0()}
            state={approval0State}
            className={`mt-2 !bg-white !text-blue-500 border border-blue-500 hover:!bg-blue-300 hover:!border-blue-300 hover:!text-white`}
          />
        )}
        {token1Allowance && token1Allowance.isZero() && (
          <TransactionButton
            label={`Approve ${token1.symbol}`}
            onClick={() => approveToken1()}
            state={approval1State}
            className={`mt-2 !bg-white !text-blue-500 border border-blue-500 hover:!bg-blue-300 hover:!border-blue-300 hover:!text-white`}
          />
        )}
      </div>
      {price0 && (
        <p className="text-center">
          <b>{percentShareExpected(price0)}</b> % Share of Pool
        </p>
      )}
      {error ? (
        <button
          className={`bg-red-500 text-white ease-in-out duration-300 rounded px-2 py-1.5 my-2 disabled:opacity-60`}
          disabled
        >
          {error}
        </button>
      ) : (
        <TransactionButton onClick={() => {}} className="mt-2" state={undefined} label="Supply" />
      )}
    </div>
  ) : (
    <>Loading...</>
  );
};
