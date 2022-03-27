import { abis } from '@dex/contracts';
import { useCall } from '@usedapp/core';
import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { getContract } from '../common/utils';

export const useLiquidityReserve = (address) => {
  const { error, value: reserves } =
    useCall({
      contract: getContract(abis.pair, address),
      method: 'getReserves',
      args: [],
    }) ?? {};

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  return reserves
    ? {
        error,
        active: true,
        r0: reserves[0],
        r1: reserves[1],
        timestamp: reserves[2],
      }
    : {};
};
