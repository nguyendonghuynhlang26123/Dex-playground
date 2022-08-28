import { parseUnits } from '@ethersproject/units';
import { useDebounce } from '@usedapp/core';
import { BigNumber } from 'ethers';
import React, { useState, useCallback, useEffect } from 'react';
import { UniswapUtils } from '../common/UniswapUtils';
import { prettyNum } from '../common/utils';

/**
 * This hooks to handle the inputs-outputs automatically, when user input token 1
 * fetch token 2's estimate price. When input token 2, fetch token 1.
 * TODO
 */
export const useLiquidityInputHandle = ({ r0, r1, debounceTime = 100, token0, token1 }) => {
  const [[input0, input1], setInput] = useState(['', '']);
  const [[output0, output1], setOutput] = useState(['', '']);
  const debouncedValue0 = useDebounce(input0, debounceTime);
  const debouncedValue1 = useDebounce(input1, debounceTime);
  const [swapBy, setSwapBy] = useState(null);

  useEffect(() => {
    if (token0 && debouncedValue0 && !isNaN(debouncedValue0)) {
      const valueWithDigits = parseUnits(debouncedValue0.toString(), token0.decimals);
      const data = UniswapUtils.quote(valueWithDigits, r0, r1);
      setInput((prv) => [prv[0], '']);
      setOutput((prvState) => [prvState[0], data.toString()]);
    }
  }, [token0, debouncedValue0, r0, r1]);

  useEffect(() => {
    if (token1 && debouncedValue1 && !isNaN(debouncedValue1)) {
      const valueWithDigits = parseUnits(debouncedValue1.toString(), token1.decimals);
      const data = UniswapUtils.quote(valueWithDigits, r1, r0);
      console.log('log ~ file: useLiquidityInputHandle.jsx ~ line 33 ~ useEffect ~ data', data);
      setInput((prv) => ['', prv[1]]);
      setOutput((prvState) => [data.toString(), prvState[1]]);
    }
  }, [token1, debouncedValue1, r0, r1]);

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
    price0: output0 ? BigNumber.from(output0) : input0 ? parseUnits(input0, token0?.decimals ?? 18) : '',
    price1: output1 ? BigNumber.from(output1) : input1 ? parseUnits(input1, token1?.decimals ?? 18) : '',
    token0InputProps,
    token1InputProps,
    swapBy,
  };
};
