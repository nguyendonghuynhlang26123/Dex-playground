import { parseUnits } from '@ethersproject/units';
import { useDebounce } from '@usedapp/core';
import { BigNumber, FixedNumber } from 'ethers';
import React, { useState, useEffect } from 'react';
import { UniswapUtils } from '../common/UniswapUtils';
import { prettyNum } from '../common/utils';

/**
 * This hooks to handle the inputs-outputs automatically, when user input token 1
 * fetch token 2's estimate price. When input token 2, fetch token 1.
 * TODO
 */
const ZERO = BigNumber.from(0);
export const useLimitInputHandler = ({ r0, r1, debounceTime = 100, tokenInput, tokenOutput }) => {
  const [[input0, input1], setInput] = useState(['', '']);
  const [[price0, price1], setPrice] = useState([ZERO, ZERO]);
  const [rateInput, setInputRate] = useState('');
  const [currentRate, setCurrentRate] = useState(0);
  const [marketRate, setMarketRate] = useState(0);

  const reset = () => {
    setInput(['', '']);
    setPrice([ZERO, ZERO]);
    setInputRate('');
    setCurrentRate(0);
    setMarketRate(0);
  };

  useEffect(() => {
    if (r0 && r1) {
      if (input0 && !isNaN(+input0) && Number(input0)) {
        handleUserInputToken0(input0, tokenInput, r0, r1);
      } else if (input1 && !isNaN(+input1) && Number(input1)) {
        handleUserInputToken1(input1, tokenOutput, r0, r1);
      }
    } else reset();
  }, [r0, r1, tokenInput, tokenOutput]);

  const handleUserInputToken0 = async (input, inToken, _r0, _r1) => {
    if (isNaN(+input)) return;
    //Start handling
    const inputInBN = parseUnits(input.toString(), inToken.decimals);
    const outputInBN = BigNumber.from(UniswapUtils.getAmountOut(inputInBN, _r0, _r1));
    const output = prettyNum(outputInBN);
    const rate = UniswapUtils.getRate(inputInBN, outputInBN);

    setInput((prv) => [prv[0], output]);
    setPrice([inputInBN, outputInBN]);
    setCurrentRate(rate);
    setInputRate(rate.round(4).toString());
    setMarketRate(rate);
  };
  const handleUserInputToken1 = async (output, outToken, _r0, _r1) => {
    if (isNaN(+output)) return;
    const outputInBN = parseUnits(output, outToken.decimals);
    const inputInBN = BigNumber.from(UniswapUtils.getAmountIn(outputInBN, r0, r1));
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
        const input = ev.target.value.trim();
        if (isNaN(+input)) return;
        if (!input) reset();
        else {
          setInput((prv) => [input, prv[1]]);

          if (r0 && r1 && Number(input)) {
            handleUserInputToken0(input, tokenInput, r0, r1);
          }
        }
      },
    };
  }, [input0, r0, r1, tokenInput]);

  const tokenOutputProps = React.useMemo(() => {
    return {
      value: input1,
      onChange: (ev) => {
        const output = ev.target.value.trim();
        if (isNaN(+output)) return;
        if (!output) reset();
        else {
          setInput((prv) => [prv[0], output]);

          if (r0 && r1 && Number(output)) {
            handleUserInputToken1(output, tokenOutput, r0, r1);
          }
        }
      },
    };
  }, [input1, r0, r1, tokenOutput]);

  const rateInputProps = React.useMemo(() => {
    return {
      value: rateInput,
      onChange: (ev) => {
        const price = ev.target.value.trim();
        if (isNaN(+price)) return;
        if (!price) {
          setInputRate('');
          setCurrentRate(FixedNumber.from(0));
          setInput((prv) => [prv[0], '']);
          setPrice((prv) => [prv[0], ZERO]);
        } else {
          setInputRate(price);
          setCurrentRate(FixedNumber.from(price));
          if (price && price0 && Number(price)) {
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
