import { abis, addresses } from '@dex/contracts';
import { formatUnits } from '@ethersproject/units';
import { useEthers, useToken, useTokenBalance } from '@usedapp/core';
import { FixedNumber } from 'ethers';
import React, { useCallback, useState, useEffect } from 'react';
import { getContract, prettyNum } from '../../common/utils';
import { useLiquidityInputHandle } from '../../hooks/useLiquidityInputHandle';
import { TransactionButton } from '../common';

export const HasLiquidity = ({ r0, r1 }) => {
  const { account, library } = useEthers();
  const mintedLiquidity = useTokenBalance(addresses[4].pair, account);
  const { symbol, totalSupply } = useToken(addresses[4].pair) ?? {};

  const routerContract = getContract(abis.router, addresses[4].router, library);
  const { price0, price1, token0InputProps, token1InputProps } = useLiquidityInputHandle({
    r0,
    r1,
    debounceTime: 200,
  });

  const calculateShare = (minted, total) => {
    return FixedNumber.from(minted.mul(100)).divUnsafe(FixedNumber.from(total)).ceiling(); //Ceil up ?;
  };

  return mintedLiquidity ? (
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
      <p className="font-bold mt-4 ">Add liquidity</p>
      <div className="flex flex-row w-full space-x-2 items-center">
        <input {...token0InputProps} id="0" className="flex-1 w-48 border border-gray-300 rounded px-2 py-1 my-0.5" />
        <input {...token1InputProps} id="1" className="flex-1 w-48 border border-gray-300 rounded px-2 py-1 my-0.5" />
      </div>
      <TransactionButton onClick={() => {}} className="mt-2" state={undefined} label="Provide" />
    </div>
  ) : (
    <>Loading...</>
  );
};
