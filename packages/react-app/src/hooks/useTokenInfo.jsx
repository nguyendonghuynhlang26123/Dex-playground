import { useEthers, useToken } from '@usedapp/core';
import React, { useEffect, useState } from 'react';
import { TokenUtils } from '../common/TokenUtils';

export const useTokenInfo = (tokenAddress) => {
  const { library: provider, account } = useEthers();
  const [token, setToken] = useState();
  useEffect(() => {
    if (!provider || !account) return;
    if (tokenAddress) TokenUtils.getTokenInfo(provider, tokenAddress).then(setToken);
  }, [tokenAddress, provider, account]);
  return token;
};
