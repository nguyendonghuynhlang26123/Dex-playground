import { abis, addresses } from '@dex/contracts';
import { parseEther } from '@ethersproject/units';
import { useDebounce, useEthers, useToken, useTokenAllowance } from '@usedapp/core';
import React, { useCallback, useEffect, useState } from 'react';
import { RiArrowUpDownLine } from 'react-icons/ri';
import { getContract, prettyNum } from '../../common/utils';
import { useLiquidityReserve } from '../../hooks';
import { TransactionButton } from '../common';

export const Swap = ({ token1Address, token2Address, swapPosition }) => {
  const { library, account } = useEthers();
  const token1 = useToken(token1Address);
  const token2 = useToken(token2Address);
  const allowanceToken1 = useTokenAllowance(token1Address, account, addresses[4].pair);
  console.log('log ~ file: index.jsx ~ line 14 ~ Swap ~ allowanceToken1', allowanceToken1);
  const routerContract = getContract(abis.router, addresses[4].router, library);
  const [[input1, input2], setInput] = useState(['', '']);
  const [[output1, output2], setOutput] = useState(['', '']);
  const { active, r0, r1 } = useLiquidityReserve(addresses[4].pair);
  const debouncedValue1 = useDebounce(input1, 1000);
  const debouncedValue2 = useDebounce(input2, 1000);
  const [exchangePrice, setExchangePrice] = useState(0);

  const getAmountIn = useCallback(
    async (amountOut) => {
      if (r0 && r1) {
        return await routerContract.getAmountIn(parseEther(amountOut.toString()), r0, r1);
      }
    },
    [r0, r1, routerContract]
  );
  const getAmountOut = useCallback(
    async (amountIn) => {
      if (r0 && r1) {
        return await routerContract.getAmountOut(parseEther(amountIn.toString()), r0, r1);
      }
      return undefined;
    },
    [r0, r1, routerContract]
  );

  useEffect(() => {
    if (debouncedValue1) {
      console.log('log ~ file: index.jsx ~ line 41 ~ useEffect ~ debouncedValue1', debouncedValue1);
      getAmountOut(debouncedValue1).then((data) => {
        setInput((prv) => [prv[0], '']);
        setOutput((prvState) => [prvState[0], prettyNum(data, 18)]);
      });
    }
  }, [debouncedValue1, r0, r1]);

  useEffect(() => {
    if (debouncedValue2) {
      console.log('log ~ file: index.jsx ~ line 51 ~ useEffect ~ debouncedValue2', debouncedValue2);
      getAmountIn(debouncedValue2).then((data) => {
        setInput((prv) => ['', prv[1]]);
        setOutput((prvState) => [prettyNum(data, 18), prvState[1]]);
      });
    }
  }, [debouncedValue2, r0, r1]);

  useEffect(() => {
    if (r0 && r1 && token1 && token2)
      getAmountOut(1).then((value) =>
        setExchangePrice(`1 ${token1.symbol} = ${prettyNum(value, token2.decimals)} ${token2.symbol}`)
      );
  }, [r0, r1, token1, token2, getAmountOut]);

  const token1InputHandle = (ev) => {
    setInput((prvState) => [ev.target.value, prvState[1]]);
    setOutput(['', '']);
  };

  const token2InputHandle = (ev) => {
    setInput((prvState) => [prvState[0], ev.target.value]);
    setOutput(['', '']);
  };

  return active && token1 && token2 ? (
    <form className="flex flex-col ">
      <h1 className="text-[32px] text-center mt-6 mb-2 font-bold">SWAP</h1>

      <div className="flex flex-row space-x-2 my-2 ">
        <label className="w-28">
          {token1.name} ({token1.symbol}):{' '}
        </label>
        <input
          className="border border-gray-400 rounded flex-grow px-2 py-1"
          value={input1 ? input1 : output1}
          onChange={token1InputHandle}
        />
      </div>
      <button
        className="rounded-full border border-gray-300 hover:bg-gray-200 w-6 h-6 flex justify-center items-center mx-auto"
        onClick={swapPosition}
      >
        <RiArrowUpDownLine />
      </button>
      <div className="flex flex-row space-x-2 my-2 ">
        <label className="w-28">
          {token2.name} ({token2.symbol}):{' '}
        </label>
        <input
          className="border border-gray-400 rounded flex-grow px-2 py-1"
          value={input2 ? input2 : output2}
          onChange={token2InputHandle}
        />
      </div>
      <p className="text-gray-600 text-center">{exchangePrice}</p>
      <TransactionButton className="mt-2" label={`Approve ${token1.symbol}`} />
      <button
        className="hover:bg-blue-200 hover:font-bold border border-blue-500 text-blue-500 rounded px-2 py-1 my-2 w-full"
        onClick={() => {}}
      >
        Swap
      </button>
    </form>
  ) : (
    <p>Loading...</p>
  );
};
