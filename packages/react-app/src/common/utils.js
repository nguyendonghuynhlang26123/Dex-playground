import { formatUnits, parseUnits } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';

import { FixedNumber, utils, ethers } from 'ethers';
export const truncate = (str, maxDecimalDigits) => {
  if (str.includes('.')) {
    const parts = str.split('.');
    if (maxDecimalDigits === 0) return parts[0];
    return parts[0] + '.' + parts[1].slice(0, maxDecimalDigits);
  }
  return str;
};
export const prettyNum = (b, unit, digits = 4) => truncate(formatUnits(b, unit), digits);
export const getContract = (abi, address, provider = undefined) => {
  const contractInterface = new utils.Interface(abi);
  return new Contract(address, contractInterface, provider);
};

export const parseInput = (value, decimals) => {
  return parseUnits(value, decimals);
};

export const toInteger = (floatNumber) => {
  const comps = floatNumber.toString().split('.');
  return comps[0];
};

export const calculateShare = (total, percent) => {
  const result = FixedNumber.from(total).mulUnsafe(FixedNumber.from(percent)).divUnsafe(FixedNumber.from(100));
  return toInteger(result);
};

export const generateSecret = () => {
  const secret = ethers.utils.hexlify(ethers.utils.randomBytes(21)).replace('0x', '');
  const fullSecret = `2022001812713618127252${secret}`;
  const { privateKey, address } = new ethers.Wallet(fullSecret);
  return [privateKey, address];
};

export const classNames = (...args) => {
  return args.join(' ');
};

export const compareAddress = (address1, address2) => address1.toLowerCase() === address2.toLowerCase();

// Format date as dd/mm/yyyy
export function formatDate(date) {
  function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }
  return [padTo2Digits(date.getDate()), padTo2Digits(date.getMonth() + 1), date.getFullYear()].join('/');
}
