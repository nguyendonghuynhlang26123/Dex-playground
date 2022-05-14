import { BigNumber } from 'ethers';
import { ethers } from 'ethers';
import axios from 'axios';

export const BASE_FEE = ethers.BigNumber.from('10000000000000000'); // 0,01 eth

export async function getGasPrice(): Promise<BigNumber> {
  let gasPrice = BigNumber.from(0);

  // Chain Id should be mainnet to axios.get gas data
  try {
    // const res = await axios.get('https://ethgasstation.info/json/ethgasAPI.json')
    const [resGasStation, resGasTracker, resHistoric] = await Promise.all([
      getGasStation(),
      getGasTracker(),
      gasTrackerHistoric(),
    ]);

    gasPrice = BigNumber.from(
      Math.max(
        resGasStation.toNumber(),
        resGasTracker.toNumber(),
        resHistoric.toNumber()
      )
    );

    if (gasPrice.toNumber() > 200000000000) {
      return BigNumber.from(0);
    }
  } catch (e: any) {
    console.log('Error when axios.geting gas data:', e.message);
  }
  return gasPrice;
}

async function getGasStation(): Promise<BigNumber> {
  let gasPrice = BigNumber.from(0);

  try {
    const res = await axios.get(
      'https://ethgasstation.info/json/ethgasAPI.json'
    );
    // It comes as 100 when should be 10.0
    gasPrice = BigNumber.from(res.data.fastest / 10);
  } catch (e: any) {
    console.log('Error when axios.geting gas data:', e.message);
  }

  return gasPrice.mul(BigNumber.from(1e9));
}

async function getGasTracker(): Promise<BigNumber> {
  let gasPrice = BigNumber.from(0);
  try {
    const res: any = await axios.get(
      'https://api.etherscan.io/api?module=gastracker&action=gasestimate&gasprice=2000000000&apikey=39MIMBN2J9SFTJW1RKQPYJI89BAPZEVJVD'
    );
    gasPrice = BigNumber.from(Math.round(res.data.result / 100));
  } catch (e: any) {
    console.log(
      'Error when axios.geting gas data from gas tracker:',
      e.message
    );
  }

  return gasPrice.mul(BigNumber.from(1e9));
}

async function gasTrackerHistoric(): Promise<BigNumber> {
  let gasPrice = BigNumber.from(0);
  try {
    const res = await axios.get(
      'https://etherscan.io/datasourceHandler?q=gashistoricaldata&draw=1&columns%5B0%5D%5Bdata%5D=lastBlock&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=age&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=safeGasPrice&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=proposeGasPrice&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=fastGasPrice&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&start=0&length=15&search%5Bvalue%5D=&search%5Bregex%5D=false'
    );
    gasPrice = BigNumber.from(
      Math.round(Number(res.data.data[0].fastGasPrice.replace(' gwei', '')))
    );
  } catch (e: any) {
    console.log(
      'Error when axios.geting gas data from gas tracker:',
      e.message
    );
  }

  return gasPrice.mul(BigNumber.from(1e9));
}
