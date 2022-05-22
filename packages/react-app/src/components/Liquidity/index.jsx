import React, { useState, useMemo } from 'react';
import { useLiquidityReserve } from '../../hooks';
import { useEthers, useToken, useTokenBalance } from '@usedapp/core';
import { FixedNumber } from 'ethers';
import { calculateShare, prettyNum } from '../../common/utils';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { AddLiquidity } from './AddLiquidity';
import { RemoveLiquidity } from './RemoveLiquidity';

export const Liquidity = ({ token0Address, token1Address, pairAddress }) => {
  const { account } = useEthers();

  // Add/Remove mode
  const [mode, setMode] = useState('add');

  //Liquidity
  const { active, r0, r1 } = useLiquidityReserve(pairAddress, token0Address, token1Address);
  const exchangeRate = useExchangeRate({ r0, r1 });

  //Liquidity token
  const mintedLiquidity = useTokenBalance(pairAddress, account);
  const { totalSupply } = useToken(pairAddress) ?? {};
  const share = useMemo(
    () => (mintedLiquidity && totalSupply ? FixedNumber.from(mintedLiquidity.mul(100)).divUnsafe(FixedNumber.from(totalSupply)).round(4).toString() : '0'),
    [totalSupply, mintedLiquidity]
  );

  //Token
  const token0 = useToken(token0Address);
  const token1 = useToken(token1Address);
  const token0Balance = useTokenBalance(token0Address, account);
  const token1Balance = useTokenBalance(token1Address, account);

  return active && token0 && token1 && mintedLiquidity ? (
    <div className="flex flex-col mt-2">
      <div className="flex flex-row w-full divide-x space-x-2">
        <p className="flex-1 p-2 text-center">
          <b>Pool {token0.symbol}</b>
          <br />
          {prettyNum(r0, 18)}
        </p>
        <p className="flex-1 p-2 text-center">
          <b>Pool {token1.symbol}</b>
          <br /> {prettyNum(r1, 18)}
        </p>
      </div>
      <p className="italic text-gray-600 text-center">
        {exchangeRate && token0 && token1 && (
          <>
            1 {token0.symbol} = {exchangeRate} {token1.symbol}
          </>
        )}
      </p>

      <hr className="w-32 mx-auto my-2 border-gray-500" />
      {totalSupply && (
        <div className="py-2 px-4 border border-dashed border-gray-600 rounded">
          <h1 className="font-bold text-lg text-center">Your position</h1>
          <p className="flex flex-row justify-between">
            <b>Your liquidity token: </b>
            <span>
              {prettyNum(mintedLiquidity, 18)} / {prettyNum(totalSupply, 18)}
            </span>
          </p>
          <p className="flex flex-row justify-between">
            <b>Pool share: </b>
            <span>{share.toString() + '%'} </span>
          </p>
          <p className="flex flex-row justify-between">
            <b>{token0.symbol}: </b>
            <span>{prettyNum(calculateShare(r0, share))}</span>
          </p>
          <p className="flex flex-row justify-between">
            <b>{token1.symbol}: </b>
            <span>{prettyNum(calculateShare(r1, share))}</span>
          </p>
        </div>
      )}

      <div className="flex flex-row space-x-2">
        <p className={`underline mt-4 cursor-pointer hover:text-blue-500 ${mode === 'add' && 'text-green-500 font-bold'}`} onClick={() => setMode('add')}>
          Add liquidity
        </p>
        <p className={`underline mt-4 cursor-pointer  hover:text-blue-500 ${mode === 'rm' && 'text-red-500 font-bold'}`} onClick={() => setMode('rm')}>
          Remove liquidity
        </p>
      </div>

      {mode === 'add' ? (
        <AddLiquidity
          token0={token0}
          token1={token1}
          token0Address={token0Address}
          token1Address={token1Address}
          token0Balance={token0Balance}
          token1Balance={token1Balance}
          r0={r0}
          r1={r1}
          totalLPToken={totalSupply}
        />
      ) : (
        <RemoveLiquidity
          token0={token0}
          token1={token1}
          token0Address={token0Address}
          token1Address={token1Address}
          r0={r0}
          r1={r1}
          totalLPToken={totalSupply}
          lpAmount={mintedLiquidity}
        />
      )}
    </div>
  ) : (
    <>Loading...</>
  );
};
