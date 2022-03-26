import { abis, addresses } from '@dex/contracts';
import { useCall, useConfig, useEthers, useToken, useTokenBalance } from '@usedapp/core';
import React, { useEffect, useState } from 'react';
import { getContract, prettyNum } from '../../common/utils';
import { TransactionButton } from '../common';

export const Liquidity = () => {
  const { account } = useEthers();
  const [liquidityState, setLiquidityState] = useState({ r0: null, r1: null, timestampLast: 0 });
  const mintedLiquidity = useTokenBalance(addresses[4].pair, account);
  const { symbol, totalSupply } = useToken(addresses[4].pair) ?? {};
  const { error: contractCallError, value: reserves } =
    useCall({
      contract: getContract(abis.pair, addresses[4].pair),
      method: 'getReserves',
      args: [],
    }) ?? {};

  useEffect(() => {
    if (reserves) {
      const [r0, r1, time] = reserves;
      setLiquidityState({
        r0: prettyNum(r0, 18),
        r1: prettyNum(r1, 18),
        timestampLast: time,
      });
    }
  }, [reserves]);

  const calculateShare = (minted, total) => {
    console.log('log ~ file: index.jsx ~ line 31 ~ calculateShare ~ minted, total', minted, total);
    return minted.mul(100).div(total).add(1); //Ceil;
  };

  return mintedLiquidity ? (
    <div className="flex flex-col my-2">
      <h1 className="text-[32px] text-center mt-4 mb-2 font-bold">Liquidity</h1>

      <div className="flex flex-row w-full divide-x space-x-2">
        <p className="flex-1 p-2">
          <b>Reserved ONE</b>
          <br /> {liquidityState.r0}
        </p>
        <p className="flex-1 p-2">
          <b>Reserved TWO</b>
          <br /> {liquidityState.r1}
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
        <div></div>
        <p>Faucet</p>
        <input className="flex-grow border border-gray-300 rounded px-2 py-1 my-0.5" type="number" />
        <TransactionButton onClick={() => {}} className="w-24" state={undefined} label="Mint" />
      </div>
    </div>
  ) : (
    <>Loading...</>
  );
};
