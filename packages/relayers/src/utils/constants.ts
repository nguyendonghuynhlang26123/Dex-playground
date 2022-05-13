import { ethers } from 'ethers';

export const NETWORK_NAMES: { [key: string]: string } = {
  '1': 'mainnet',
  '4': 'rinkeby',
};

export const BASE_FEE = ethers.BigNumber.from('1000000000000000');
export const TIPS = ethers.BigNumber.from('2000000000');
