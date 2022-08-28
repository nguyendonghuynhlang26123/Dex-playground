import { ethers } from 'ethers';

export const NETWORK_NAMES: { [key: string]: string } = {
  '1': 'mainnet',
  '4': 'rinkeby',
  '137': 'polygon',
};

export const AVG_GAS = ethers.BigNumber.from('400000');
export const TIPS = ethers.BigNumber.from('1000000000'); //1gwei
