import { abis, addresses } from '@dex/contracts';
import { getContract } from './utils';
import { ETH_ADDRESS } from './constants';
const mapTokenImage = {
  [addresses[4].weth]:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  [addresses[4].one]: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Eo_circle_red_number-1.svg/1200px-Eo_circle_red_number-1.svg.png',
  [addresses[4].two]: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Eo_circle_blue_number-2.svg/1200px-Eo_circle_blue_number-2.svg.png',
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
  static getTokenInfo = async (provider, tokenAddress, account) => {
    if (tokenAddress === ETH_ADDRESS)
      return {
        symbol: 'ETH',
        imageUrl: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png`,
        balance: await provider.getBalance(account),
        address: tokenAddress,
      };

    const contract = getContract(abis.erc20, tokenAddress, provider);
    return {
      symbol: await contract.symbol(),
      imageUrl: mapTokenImage[tokenAddress],
      balance: await contract.balanceOf(account),
      address: tokenAddress,
    };
  };
}
