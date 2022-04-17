import { formatUnits, parseEther } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';

import { FixedNumber, utils } from 'ethers';
export const truncate = (str, maxDecimalDigits) => {
  if (str.includes('.')) {
    const parts = str.split('.');
    return parts[0] + '.' + parts[1].slice(0, maxDecimalDigits);
  }
  return str;
};
export const prettyNum = (b, unit, digits = 4) => truncate(formatUnits(b, unit), digits);
export const getContract = (abi, address, provider = undefined) => {
  const contractInterface = new utils.Interface(abi);
  return new Contract(address, contractInterface, provider);
};

export const eighteenDigits = (value) => {
  return parseEther(value);
};

export const toInteger = (floatNumber) => {
  const comps = floatNumber.toString().split('.');
  return comps[0];
};
