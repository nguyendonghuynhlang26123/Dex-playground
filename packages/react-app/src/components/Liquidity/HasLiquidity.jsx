import { abis, addresses } from '@dex/contracts';
import { formatUnits } from '@ethersproject/units';
import { useCall, useConfig, useDebouncePair, useEthers, useToken, useTokenBalance } from '@usedapp/core';
import { BigNumber, FixedNumber } from 'ethers';
import React, { useCallback, useState, useEffect } from 'react';
import { getContract, prettyNum } from '../../common/utils';
import { TransactionButton } from '../common';

export const HasLiquidity = ({ r0, r1 }) => {
  const { account } = useEthers();
  const mintedLiquidity = useTokenBalance(addresses[4].pair, account);
  const { symbol, totalSupply } = useToken(addresses[4].pair) ?? {};
  const [[input0, input1], setInput] = useState(['', '']);
  const [[output0, output1], setOutput] = useState(['', '']);
  const [debouncedValue0, debouncedValue1] = useDebouncePair(input0, input1, 200);

  useEffect(() => {
    if (debouncedValue0 && !isNaN(debouncedValue0)) {
      const expectedValue = quoteFn(BigNumber.from(debouncedValue0), false);
      if (expectedValue !== -1) {
        setInput((prv) => [prv[0], '']);
        setOutput(['', expectedValue.toString()]);
      }
    }
  }, [debouncedValue0, r0, r1]);

  useEffect(() => {
    if (debouncedValue1 && !isNaN(debouncedValue1)) {
      const expectedValue = quoteFn(BigNumber.from(debouncedValue1), false);
      if (expectedValue !== -1) {
        setInput((prv) => ['', prv[1]]);
        setOutput([expectedValue.toString(), '']);
      }
    }
  }, [debouncedValue1, r0, r1]);

  const quoteFn = useCallback(
    (amount, reversed) => {
      if (r0 && r1) {
        let _r0 = FixedNumber.from(r0);
        let _r1 = FixedNumber.from(r1);
        let _amount = FixedNumber.from(formatUnits(amount, 18));
        if (!reversed) return BigNumber.from(_r1.mulUnsafe(_amount).divUnsafe(_r0));
        else return BigNumber.from(_r0.mulUnsafe(_amount).divUnsafe(_r1));
      } else return -1;
    },
    [r0, r1]
  );

  const calculateShare = (minted, total) => {
    return minted.mul(100).div(total); //Ceil;
  };

  const handleChangeInput0 = (ev) => {
    setInput((prvState) => [ev.target.value, prvState[1]]);
    setOutput(['', '']);
  };
  const handleChangeInput1 = (ev) => {
    setInput((prvState) => [prvState[0], ev.target.value]);
    setOutput(['', '']);
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
        <input
          className=" w-48 border border-gray-300 rounded px-2 py-1 my-0.5"
          type="number"
          id="1"
          value={output0 ? prettyNum(output0, 18, 6) : input0}
          onChange={handleChangeInput0}
        />
        <input
          className=" w-48 border border-gray-300 rounded px-2 py-1 my-0.5"
          type="number"
          id="2"
          value={output1 ? prettyNum(output1, 18, 6) : input1}
          onChange={handleChangeInput1}
        />
        <TransactionButton onClick={() => {}} className="w-24" state={undefined} label="Mint" />
      </div>
    </div>
  ) : (
    <>Loading...</>
  );
};
