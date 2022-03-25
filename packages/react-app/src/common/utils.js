import { formatUnits } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';

import { utils } from 'ethers';
export const truncate = (str, maxDecimalDigits) => {
  if (str.includes('.')) {
    const parts = str.split('.');
    return parts[0] + '.' + parts[1].slice(0, maxDecimalDigits);
  }
  return str;
};
export const prettyNum = (b, unit) => truncate(formatUnits(b, unit), 4);
export const getContract = (abi, address) => {
  const contractInterface = new utils.Interface(abi);
  return new Contract(address, contractInterface);
};
