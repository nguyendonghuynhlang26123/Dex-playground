import { parseUnits } from '@ethersproject/units';
import { useDebounce } from '@usedapp/core';
import { BigNumber, FixedNumber } from 'ethers';
import React, { useState, useEffect } from 'react';
import { UniswapUtils } from '../common/UniswapUtils';
import { prettyNum } from '../common/utils';

/**
 * This hooks to handle the inputs-outputs automatically, when user input token 1
 * fetch token 2's estimate price. When input token 2, fetch token 1.
 *
 */
export const useSwapInputHandle = ({ r0, r1, debounceTime = 100, inputToken, outputToken }) => {
  const [[input0, input1], setInput] = useState(['', '']);
  const [[output0, output1], setOutput] = useState(['', '']);
  const debouncedValue0 = useDebounce(input0, debounceTime);
  const debouncedValue1 = useDebounce(input1, debounceTime);
  const [currentRate, setCurrentRate] = useState(0);
  const [swapBy, setSwapBy] = useState(null);

  const reset = () => {
    console.log('Reset');
    setInput(['', '']);
    setOutput(['', '']);
    setCurrentRate(0);
    setSwapBy(null);
  };

  useEffect(() => {
    if (inputToken && r0 && r1 && debouncedValue0 && !isNaN(+debouncedValue0) && Number(debouncedValue0)) {
      const amountIn = parseUnits(debouncedValue0.toString(), inputToken.decimals);
      const data = UniswapUtils.getAmountOut(amountIn, r0, r1);
      const rate = UniswapUtils.getRate(amountIn, data.toString());
      setCurrentRate(rate.round(4).toString());
      setInput((prv) => [prv[0], '']);
      setOutput((prvState) => [prvState[0], data.toString()]);
    }
  }, [debouncedValue0, r0, r1, inputToken]);

  useEffect(() => {
    if (outputToken && r0 && r1 && debouncedValue1 && !isNaN(+debouncedValue1) && Number(debouncedValue1)) {
      const amountOut = parseUnits(debouncedValue1.toString(), outputToken.decimals);
      const data = UniswapUtils.getAmountIn(amountOut, r0, r1);
      const rate = UniswapUtils.getRate(data.toString(), amountOut);
      setCurrentRate(rate.round(4).toString());
      setInput((prv) => ['', prv[1]]);
      setOutput((prvState) => [data.toString(), prvState[1]]);
    }
  }, [outputToken, debouncedValue1, r0, r1]);

  useEffect(() => {
    if (r0 && r1) {
      // const value = UniswapUtils.getAmountOut(parseUnits('1', inputToken.decimals), r0, r1);
      // setCurrentRate(prettyNum(value));
    } else {
      // Reset state if r0, r1 null to avoid inconsitent data
      reset();
    }
  }, [r0, r1, inputToken]);

  const token0InputProps = React.useMemo(() => {
    return {
      value: output0 ? prettyNum(output0, inputToken?.decimals ?? 18) : input0,
      onChange: (ev) => {
        const value = ev.target.value.trim();
        if (isNaN(+value)) return;
        setInput([value, '']);
        setOutput(['', '']);
        setSwapBy(0);
      },
    };
  }, [output0, input0, inputToken]);

  const token1InputProps = React.useMemo(() => {
    return {
      value: output1 ? prettyNum(output1, outputToken?.decimals ?? 18) : input1,
      onChange: (ev) => {
        const value = ev.target.value.trim();
        if (isNaN(+value)) return;
        if (value && r1 && BigNumber.from(parseUnits(value, outputToken?.decimals ?? 18)).gte(r1)) return; // Output should < r1 since it will be negative ...
        setInput(['', value]);
        setOutput(['', '']);
        setSwapBy(1);
      },
    };
  }, [output1, input1, r1, outputToken]);

  return {
    price0: output0 ? BigNumber.from(output0) : input0 ? parseUnits(input0, inputToken?.decimals ?? 18) : '',
    price1: output1 ? BigNumber.from(output1) : input1 ? parseUnits(input1, outputToken?.decimals ?? 18) : '',
    exchangePrice: currentRate,
    token0InputProps,
    token1InputProps,
    swapBy,
    reset,
  };
};
