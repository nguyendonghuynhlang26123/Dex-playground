import { abis } from '@dex/contracts';
import { useCall, useCalls } from '@usedapp/core';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getContract } from '../common/utils';

export const useLiquidityReserve = (address, token0Address, token1Address) => {
  const contract = getContract(abis.pair, address);
  const partialCall = {
    contract: contract,
    address: address,
    args: [],
  };
  const args = ['token0', 'token1', 'getReserves'].map((method) => ({ ...partialCall, method }));
  const [token0, token1, reserves] = useCalls(args) ?? [];
  const [value, setValue] = useState({});

  useEffect(() => {
    let error = undefined;
    [token0, token1, reserves].forEach((res) => {
      if (res && res.error) {
        error = res.error;
        toast.error(res.error.message);
      }
    });
    if (token0 && token1 && reserves) {
      const address0 = token0.value[0];
      const address1 = token1.value[0];

      if (token0Address === address0 && token1Address === address1)
        setValue({
          r0: reserves.value[0],
          r1: reserves.value[1],
          timestamp: reserves.value[2],
          error,
          active: true,
        });
      else if (token0Address === address1 && token1Address === address0)
        setValue({
          r0: reserves.value[1],
          r1: reserves.value[0],
          timestamp: reserves.value[2],
          error,
          active: true,
        });
    }
  }, [token0, token1, reserves, token0Address, token1Address]);

  return value;
};
