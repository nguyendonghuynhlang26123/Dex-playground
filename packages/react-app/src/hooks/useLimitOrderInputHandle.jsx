import { parseEther } from '@ethersproject/units';
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
const ZERO = BigNumber.from(0);
export const useLimitInputHandler = ({ r0, r1, debounceTime = 100 }) => {
  const [[input0, input1], setInput] = useState(['', '']);
  const [[price0, price1], setPrice] = useState([ZERO, ZERO]);
  const [rateInput, setInputRate] = useState('');
  const [currentRate, setCurrentRate] = useState(0);
  const [marketRate, setMarketRate] = useState(0);

  const reset = () => {
    console.log('Reset');
    setInput(['', '']);
    setPrice([ZERO, ZERO]);
    setInputRate('');
    setCurrentRate(0);
    setMarketRate(0);
  };

  useEffect(() => {
    if (r0 && r1) {
      if (input0 && !isNaN(input0) && Number(input0) !== 0) {
        handleUserInputToken0(input0, r0, r1);
      }
    } else reset();
  }, [r0, r1]);

  const handleUserInputToken0 = async (input, _r0, _r1) => {
    //Start handling
    const inputInBN = parseEther(input.toString());
    const outputInBN = BigNumber.from(UniswapUtils.getAmmountOut(inputInBN, _r0, _r1));
    const output = prettyNum(outputInBN);
    const rate = UniswapUtils.getRate(inputInBN, outputInBN);

    setInput((prv) => [prv[0], output]);
    setPrice([inputInBN, outputInBN]);
    setCurrentRate(rate);
    setInputRate(rate.round(4).toString());
    setMarketRate(rate);
  };
  const handleUserInputToken1 = async (output, _r0, _r1) => {
    const outputInBN = parseEther(output.toString());
    const inputInBN = BigNumber.from(UniswapUtils.getAmmountIn(outputInBN, r0, r1));
    const input = prettyNum(inputInBN);
    const rate = UniswapUtils.getRate(inputInBN, outputInBN);

    setInput([input, output]);
    setPrice([inputInBN, outputInBN]);
    setCurrentRate(rate);
    setInputRate(rate.round(4).toString());
    setMarketRate(rate);
  };
  const handlePriceInput = async (price, currentInputPrice) => {
    const fInputPrice = FixedNumber.from(currentInputPrice);
    const fOutputPrice = fInputPrice.mulUnsafe(FixedNumber.from(price));
    const outputInInteger = fOutputPrice.floor().toString().split('.')[0];

    const output = prettyNum(outputInInteger);
    const outputInBN = BigNumber.from(outputInInteger);

    setInput((prv) => [prv[0], output]);
    setPrice((prv) => [prv[0], outputInBN]);
  };

  // Handling Input's state
  const tokenInputProps = React.useMemo(() => {
    return {
      value: input0,
      onChange: (ev) => {
        const input = ev.target.value;
        if (isNaN(input)) return;
        if (!input || !Number(input)) reset();
        else {
          setInput((prv) => [input, prv[1]]);

          if (r0 && r1) {
            console.log('Input: ', input);
            handleUserInputToken0(input, r0, r1);
          }
        }
      },
    };
  }, [input0, r0, r1]);

  const tokenOutputProps = React.useMemo(() => {
    return {
      value: input1,
      onChange: (ev) => {
        const output = ev.target.value;
        if (isNaN(output)) return;
        if (!output || !Number(output)) reset();
        else {
          setInput((prv) => [prv[0], output]);

          if (r0 && r1) {
            handleUserInputToken1(output, r0, r1);
          }
        }
      },
    };
  }, [input1, r0, r1]);

  const rateInputProps = React.useMemo(() => {
    return {
      value: rateInput,
      onChange: (ev) => {
        const price = ev.target.value;
        if (isNaN(price)) return;
        if (!price || !Number(price)) {
          setInputRate('');
          setCurrentRate(FixedNumber.from(0));
          setInput((prv) => [prv[0], '']);
          setPrice((prv) => [prv[0], ZERO]);
        } else {
          setInputRate(price);
          setCurrentRate(FixedNumber.from(price));
          if (price && price0) {
            handlePriceInput(price, price0);
          }
        }
      },
    };
  }, [rateInput, price0]);

  return {
    price0,
    price1,
    currentRate,
    marketRate,
    tokenInputProps,
    tokenOutputProps,
    rateInputProps,
    reset,
  };
};
