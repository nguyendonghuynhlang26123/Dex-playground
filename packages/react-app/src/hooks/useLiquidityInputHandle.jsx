import { parseEther } from '@ethersproject/units';
import { useDebounce } from '@usedapp/core';
import { BigNumber } from 'ethers';
import React, { useState, useCallback, useEffect } from 'react';
import { UniswapUtils } from '../common/UniswapUtils';
import { prettyNum } from '../common/utils';

/**
 * This hooks to handle the inputs-outputs automatically, when user input token 1
 * fetch token 2's estimate price. When input token 2, fetch token 1.
 *
 */
export const useLiquidityInputHandle = ({ r0, r1, debounceTime = 100 }) => {
  const [[input0, input1], setInput] = useState(['', '']);
  const [[output0, output1], setOutput] = useState(['', '']);
  const debouncedValue0 = useDebounce(input0, debounceTime);
  const debouncedValue1 = useDebounce(input1, debounceTime);
  const [currentRate, setCurrentRate] = useState(0);
  const [swapBy, setSwapBy] = useState(null);

  useEffect(() => {
    if (debouncedValue0 && !isNaN(debouncedValue0)) {
      const valueWithDigits = parseEther(debouncedValue0.toString());
      const data = UniswapUtils.quote(valueWithDigits, r0, r1);
      setInput((prv) => [prv[0], '']);
      setOutput((prvState) => [prvState[0], data.toString()]);
    }
  }, [debouncedValue0, r0, r1]);

  useEffect(() => {
    if (debouncedValue1 && !isNaN(debouncedValue1)) {
      const valueWithDigits = parseEther(debouncedValue1.toString());
      const data = UniswapUtils.quote(valueWithDigits, r1, r0);
      setInput((prv) => ['', prv[1]]);
      setOutput((prvState) => [data.toString(), prvState[1]]);
    }
  }, [debouncedValue1, r0, r1]);

  useEffect(() => {
    if (r0 && r1) {
      const value = UniswapUtils.quote('1', r0, r1);
      setCurrentRate(prettyNum(value));
    }
  }, [r0, r1]);

  const token0InputProps = React.useMemo(() => {
    return {
      value: output0 ? prettyNum(output0, 18) : input0,
      onChange: (ev) => {
        const value = ev.target.value;
        if (isNaN(value)) return;
        setInput([value, '']);
        setOutput(['', '']);
        setSwapBy(0);
      },
    };
  }, [output0, input0]);

  const token1InputProps = React.useMemo(() => {
    return {
      value: output1 ? prettyNum(output1, 18) : input1,
      onChange: (ev) => {
        const value = ev.target.value;
        if (isNaN(value)) return;
        setInput(['', value]);
        setOutput(['', '']);
        setSwapBy(1);
      },
    };
  }, [output1, input1]);

  return {
    price0: output0 ? BigNumber.from(output0) : input0 ? parseEther(input0) : '',
    price1: output1 ? BigNumber.from(output1) : input1 ? parseEther(input1) : '',
    liquidityRate: currentRate,
    token0InputProps,
    token1InputProps,
    swapBy,
  };
};
