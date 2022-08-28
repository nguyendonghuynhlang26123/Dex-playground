/**
 * See all ids below
 * https://ethereum.stackexchange.com/questions/17051/how-to-select-a-network-id-or-is-there-a-list-of-network-ids
 */
export const GOERLI_ID = 5;
export const KOVAN_ID = 42;
export const MAINNET_ID = 1;
export const RINKEBY_ID = 4;
export const ROPSTEN_ID = 3;
export const MATIC_ID = 137;

export default {
  [RINKEBY_ID]: {
    factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',

    one: '0xE347Cd0934E878B236DcCF82fe419A92404Da229',
    two: '0xE73bcbaF9ff36D66C5b7805c8c64D389FD7fdb75',
    three: '0x53D8285d78C1E88f60e035EAF5163A3DDcd8B4d1',
    four: '0x02BbE2B0e72cDB9A96CacbD0c66FbCD6a898Ed4e',

    weth: '0xc778417E063141139Fce010982780140Aa0cD5Ab',

    coreProtocol: '0xB8Cd8281512174DB05707ffe7Bd310f83Ec5cC56',
    entryOrderModule: '0x982eF160530CEE015543e89b224966827e62A4c2',
  },
  [MATIC_ID]: {
    factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
    router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',

    one: '0x03014bD6A40D06908C5301A7015DFFC25FAeeF05',
    two: '0x4d93C0a2353F2776b8Dd83b8fA9Eb624e5B1E2E3',
    three: '0xcb0Cde022fbA31bD37c6B3BfC9F07550750f40Fe',
    four: '0x0373455AE8510853C9Ea66638b00093663c17B14',

    weth: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',

    coreProtocol: '0x0Ea72B2D4B07c06b372296f9C1cb8E0231d06703',
    entryOrderModule: '0x36fe9408f1D35d134C46d3F20c3a54601A371e34',
    uniswapV2Handler: '0x4140CD1fb06B5c5a19BC85f5b279d298b02142C2',
  },
};
