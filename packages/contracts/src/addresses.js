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
  one: '0xE347Cd0934E878B236DcCF82fe419A92404Da229',
  two: '0xE73bcbaF9ff36D66C5b7805c8c64D389FD7fdb75',
};

export default {
  [RINKEBY_ID]: {
    ...commonContracts,
  },
};
