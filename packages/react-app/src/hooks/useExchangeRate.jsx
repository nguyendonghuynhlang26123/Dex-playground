import { parseUnits } from '@ethersproject/units';
import { useState, useEffect } from 'react';
import { UniswapUtils } from '../common/UniswapUtils';
import { prettyNum } from '../common/utils';

/**
 * This hooks to fetch current exchange rate of a pair of tokens.
 *
 */
export const useExchangeRate = ({ r0, r1, inputDecimal }) => {
  const [currentRate, setCurrentRate] = useState(0);

  useEffect(() => {
    if (r0 && r1 && inputDecimal) {
      const value = UniswapUtils.getAmountOut(parseUnits('1', inputDecimal), r0, r1);
      setCurrentRate(prettyNum(value));
    }
  }, [r0, r1, inputDecimal]);

  return currentRate;
};
