import { Rinkeby } from '@usedapp/core';

export const envConfig = {
  infuraKey: '9790bda3dc49412ea06c22055b3489b7',
  slippage: 0.1,
  deadline: 30,
  allowNetworks: [Rinkeby.chainId],
  protocolAvgGas: 300000,
};

export const networkConfig = {
  readOnlyChainId: Rinkeby.chainId,
  readOnlyUrls: {
    [Rinkeby.chainId]: 'https://rinkeby.infura.io/v3/' + envConfig.infuraKey,
  },
  networks: [Rinkeby],
};
