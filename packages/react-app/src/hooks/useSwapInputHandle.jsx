import { parseEther } from '@ethersproject/units';
import { useDebounce } from '@usedapp/core';
import { BigNumber } from 'ethers';
import React, { useState, useCallback, useEffect } from 'react';
import { prettyNum } from '../common/utils';

/**
 * This hooks to handle the inputs-outputs automatically, when user input token 1
 * fetch token 2's estimate price. When input token 2, fetch token 1.
 *
 */
export const useSwapInputHandle = ({ r0, r1, routerContract, debounceTime = 1000 }) => {
  const [[input0, input1], setInput] = useState(['', '']);
  const [[output0, output1], setOutput] = useState(['', '']);
  const debouncedValue0 = useDebounce(input0, debounceTime);
  const debouncedValue1 = useDebounce(input1, debounceTime);
  const [currentRate, setCurrentRate] = useState(0);
  const [swapBy, setSwapBy] = useState(null);

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
    if (debouncedValue0 && !isNaN(debouncedValue0)) {
      getAmountOut(debouncedValue0).then((data) => {
        setInput((prv) => [prv[0], '']);
        setOutput((prvState) => [prvState[0], data.toString()]);
      });
    }
  }, [debouncedValue0, r0, r1]);

  useEffect(() => {
    if (debouncedValue1 && !isNaN(debouncedValue1)) {
      getAmountIn(debouncedValue1).then((data) => {
        setInput((prv) => ['', prv[1]]);
        setOutput((prvState) => [data.toString(), prvState[1]]);
      });
    }
  }, [debouncedValue1, r0, r1]);

  useEffect(() => {
    if (r0 && r1) getAmountOut(1).then((value) => setCurrentRate(prettyNum(value)));
  }, [r0, r1, getAmountOut]);

  const token0InputProps = React.useMemo(() => {
    return {
      value: output0 ? prettyNum(output0, 18) : input0,
      onChange: (ev) => {
        setInput((prvState) => [ev.target.value, prvState[1]]);
        setOutput(['', '']);
        setSwapBy(0);
      },
    };
  }, [output0, input0]);

  const token1InputProps = React.useMemo(() => {
    return {
      value: output1 ? prettyNum(output1, 18) : input1,
      onChange: (ev) => {
        setInput((prvState) => [prvState[0], ev.target.value]);
        setOutput(['', '']);
        setSwapBy(1);
      },
    };
  }, [output1, input1]);

  return {
    price0: output0 ? BigNumber.from(output0) : input0 ? parseEther(input0) : '',
    price1: output1 ? BigNumber.from(output1) : input1 ? parseEther(input1) : '',
    exchangePrice: currentRate,
    token0InputProps,
    token1InputProps,
    swapBy,
  };
};
