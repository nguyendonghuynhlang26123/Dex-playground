import React from 'react';
import { ERC20Interface, useContractFunction } from '@usedapp/core';
import { Contract } from '@ethersproject/contracts';
import { constants } from 'ethers';

export const useApprove = (tokenAddress, address, txName = '') => {
  const { state, send } = useContractFunction(new Contract(tokenAddress, ERC20Interface), 'approve', {
    transactionName: txName,
  });

  const approveToken = React.useCallback(() => {
    return send(address, constants.MaxUint256);
  }, [address, send]);

  return [state, approveToken];
};
