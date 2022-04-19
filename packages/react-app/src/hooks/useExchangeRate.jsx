import { parseEther } from '@ethersproject/units';
import { useState, useEffect } from 'react';
import { UniswapUtils } from '../common/UniswapUtils';
import { prettyNum } from '../common/utils';

/**
 * This hooks to fetch current exchange rate of a pair of tokens.
 *
 */
export const useExchangeRate = ({ r0, r1 }) => {
  const [currentRate, setCurrentRate] = useState(0);

  useEffect(() => {
    if (r0 && r1) {
      const value = UniswapUtils.getAmmountOut(parseEther('1'), r0, r1);
      setCurrentRate(prettyNum(value));
    }
  }, [r0, r1]);

  return currentRate;
};
