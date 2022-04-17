import { Rinkeby } from '@usedapp/core';

export const envConfig = {
  infuraKey: process.env.REACT_APP_INFURA_KEY,
  slippage: 0.1,
  deadline: 30,
  allowNetworks: [Rinkeby.chainId],
};

export const networkConfig = {
  readOnlyChainId: Rinkeby.chainId,
  readOnlyUrls: {
    [Rinkeby.chainId]: 'https://rinkeby.infura.io/v3/' + envConfig.infuraKey,
  },
  networks: [Rinkeby],
};
