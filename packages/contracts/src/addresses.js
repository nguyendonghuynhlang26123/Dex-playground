/**
 * See all ids below
 * https://ethereum.stackexchange.com/questions/17051/how-to-select-a-network-id-or-is-there-a-list-of-network-ids
 */
export const GOERLI_ID = 5;
export const KOVAN_ID = 42;
export const MAINNET_ID = 1;
export const RINKEBY_ID = 4;
export const ROPSTEN_ID = 3;

const commonContracts = {
  factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
};

export default {
  [RINKEBY_ID]: {
    ...commonContracts,
    one: '0xE347Cd0934E878B236DcCF82fe419A92404Da229',
    two: '0xE73bcbaF9ff36D66C5b7805c8c64D389FD7fdb75',
    pair: '0xF49266Fbc2b1f4785CA1f56AD55f63fa9d3300F2',
  },
};
