import { abis, addresses } from '@dex/contracts';
import { getContract, prettyNum } from './utils';
import { ETH_ADDRESS } from './constants';
import { tokens } from './supportTokens.json';
import { isAddress } from '@ethersproject/address';

const mapTokenImage = {
  [addresses[137].weth.toLowerCase()]:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  [addresses[137].one.toLowerCase()]:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Eo_circle_red_number-1.svg/1200px-Eo_circle_red_number-1.svg.png',
  [addresses[137].two.toLowerCase()]:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Eo_circle_blue_number-2.svg/1200px-Eo_circle_blue_number-2.svg.png',
};
export class TokenUtils {
  static approveToken = async (provider, tokenAddress, address, amount) => {
    const contract = getContract(abis.erc20, tokenAddress, provider);
    return await contract.approve(address, amount);
  };
  static getAllowance = async (provider, tokenAddress, address) => {
    const contract = getContract(abis.erc20, tokenAddress, provider);
    return await contract.allowance(address);
  };
  static getTokenBalance = async (provider, tokenAddress, account) => {
    if (tokenAddress === ETH_ADDRESS) return await provider.getBalance(account);

    const contract = getContract(abis.erc20, tokenAddress, provider);
    return await contract.balanceOf(account);
  };

  // Get token info, in production, this should call api below to get the token icon, however, for this time I will hard code the images
  // https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${tokenAddress}/logo.png
  static getTokenInfo = async (provider, tokenAddress, account = undefined) => {
    let balance;
    if (tokenAddress === ETH_ADDRESS) {
      balance = isAddress(account) ? await provider.getBalance(account) : null;
      return {
        symbol: 'ETH',
        imageUrl: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png`,
        balance: account ? await provider.getBalance(account) : null,
        decimals: 18,
        address: tokenAddress,
        readable: balance ? prettyNum(balance, 18) : '0',
      };
    }

    const contract = getContract(abis.erc20, tokenAddress, provider);
    balance = isAddress(account) ? await contract.balanceOf(account) : null;
    const token = tokens.find((token) => tokenAddress.toLowerCase() === token.address.toLowerCase());
    if (token) {
      return {
        ...token,
        balance: balance,
        readable: balance ? prettyNum(balance, 18) : '0',
      };
    }
    return {
      name: await contract.name(),
      symbol: await contract.symbol(),
      decimals: await contract.decimals(),
      imageUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/' + tokenAddress + '/logo.png',
      balance: balance,
      address: tokenAddress,
      readable: balance ? prettyNum(balance, 18) : '0',
    };
  };

  static isERC20Token = async (provider, tokenAddress) => {
    if (tokenAddress === ETH_ADDRESS) return false;
    const contract = getContract(abis.erc20, tokenAddress, provider);
    try {
      const symbol = await contract.symbol();
      return symbol !== null && symbol !== undefined;
    } catch (e) {
      return false;
    }
  };
}
