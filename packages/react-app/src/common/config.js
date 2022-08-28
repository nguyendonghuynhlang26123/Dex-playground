import { Polygon } from '@usedapp/core';

export const envConfig = {
  infuraKey: '9790bda3dc49412ea06c22055b3489b7',
  slippage: 0.1,
  deadline: 30,
  allowNetworks: [Polygon.chainId],
  protocolAvgGas: 400000,
  protocolTips: 1000000000,
  defaultRangePercent: 20,
};

export const networkConfig = {
  readOnlyChainId: Polygon.chainId,
  readOnlyUrls: {
    // [Rinkeby.chainId]: 'https://rinkeby.infura.io/v3/' + envConfig.infuraKey,
    [Polygon.chainId]: 'https://polygon-mainnet.g.alchemy.com/v2/TI0Hp-KalL7vhgdsmEqOFO1NarhM15si',
  },
  networks: [Polygon],
};

export const networkNames = {
  1: 'mainnet',
  3: 'rinkeby',
  4: 'rinkeby',
  5: 'goerli',
  42: 'kovan',
  137: 'polygon',
};
