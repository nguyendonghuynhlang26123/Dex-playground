import { abis, addresses } from '@dex/contracts';
import { useCall, useConfig, useEthers, useToken, useTokenBalance } from '@usedapp/core';
import React, { useEffect, useState } from 'react';
import { getContract, prettyNum } from '../../common/utils';
import { useLiquidityReserve } from '../../hooks';
import { TransactionButton } from '../common';

export const Liquidity = () => {
  const { account } = useEthers();
  const mintedLiquidity = useTokenBalance(addresses[4].pair, account);
  const { symbol, totalSupply } = useToken(addresses[4].pair) ?? {};
  const { active, r0, r1, timestamp } = useLiquidityReserve(addresses[4].pair, addresses[4].two, addresses[4].one);

  const calculateShare = (minted, total) => {
    return minted.mul(100).div(total); //Ceil;
  };

  return mintedLiquidity && active ? (
    <div className="flex flex-col my-2">
      <h1 className="text-[32px] text-center mt-4 mb-2 font-bold">Liquidity</h1>

      <div className="flex flex-row w-full divide-x space-x-2">
        <p className="flex-1 p-2">
          <b>Reserved ONE</b>
          <br /> {prettyNum(r0, 18)}
        </p>
        <p className="flex-1 p-2">
          <b>Reserved TWO</b>
          <br /> {prettyNum(r1, 18)}
        </p>
      </div>

      <hr className="w-32 mx-auto my-2 border-gray-500" />
      {symbol && (
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
      <div className="flex flex-row w-full space-x-2 items-center">
        <p>Faucet</p>
        <input className="flex-grow border border-gray-300 rounded px-2 py-1 my-0.5" type="number" />
        <TransactionButton onClick={() => {}} className="w-24" state={undefined} label="Mint" />
      </div>
    </div>
  ) : (
    <>Loading...</>
  );
};
