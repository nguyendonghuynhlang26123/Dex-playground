import React from 'react';
import { ERC20Interface, useContractFunction } from '@usedapp/core';
import { Contract } from '@ethersproject/contracts';
import { constants } from 'ethers';

export const useApprove = (tokenAddress, address, txName = '') => {
  const { state, send } = useContractFunction(new Contract(tokenAddress, ERC20Interface), 'approve', {
    transactionName: txName,
  });

  const approveToken = React.useCallback(() => {
    console.log('log ~ file: useApprove.jsx ~ line 13 ~ approveToken ~ constants.MaxInt256', constants.MaxInt256);
    return send(address, constants.MaxInt256);
  }, [address, send]);

  return [state, approveToken];
};
