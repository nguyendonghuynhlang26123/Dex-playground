import { abis } from '@dex/contracts';
import { useEthers } from '@usedapp/core';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BigNumber } from 'ethers';
import { getContract } from '../common/utils';
import { UniswapUtils } from '../common/UniswapUtils';
import { parseEther, parseUnits } from '@ethersproject/units';
import { useTokenInfo } from './useTokenInfo';

export const useMarketPrice = (factoryAddress, address0, address1) => {
  const { library: provider } = useEthers();
  const token0 = useTokenInfo(address0);
  const [[r0, r1], setReserves] = useState([null, null]);
  const getAmountOut = useCallback(
    (input) => {
      if (r0 && r1) {
        const value = UniswapUtils.getAmountOut(input, r0, r1);
        return BigNumber.from(value);
      }
    },
    [r0, r1]
  );
  const getAmountIn = useCallback(
    (output) => {
      if (r0 && r1) {
        const value = UniswapUtils.getAmountIn(output, r0, r1);
        return BigNumber.from(value);
      }
    },
    [r0, r1]
  );
  const marketRate = useMemo(() => {
    if (r0 && r1 && token0) {
      const rateInString = UniswapUtils.getAmountOut(parseUnits('1', token0.decimals), r0, r1);
      return BigNumber.from(rateInString);
    }
    return null;
  }, [r0, r1, token0]);

  useEffect(() => {
    const fetchReserves = async () => {
      if (address0 && address1 && provider && factoryAddress) {
        const factoryContract = getContract(abis.factory, factoryAddress, provider);
        const pairAddress = await factoryContract.getPair(address0, address1);
        if (pairAddress !== '0x0000000000000000000000000000000000000000') {
          const pairContract = getContract(abis.pair, pairAddress, provider);
          const [_r0, _r1] = await pairContract.getReserves();
          if (BigNumber.from(address0).gt(BigNumber.from(address1))) {
            setReserves([_r1, _r0]);
          } else setReserves([_r0, _r1]);
        }
      }
      return [null, null];
    };

    fetchReserves();
  }, [address0, address1, factoryAddress, provider]);

  return [marketRate, getAmountOut, getAmountIn];
};
