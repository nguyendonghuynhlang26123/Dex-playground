import { gql } from '@apollo/client';

// See more example queries on https://thegraph.com/explorer/subgraph/uniswap/uniswap-v2
const GET_AGGREGATED_UNISWAP_DATA = gql`
  query liquidityPool($token0: String!, $token1: String!) {
    pairs(first: 1, where: { token0: $token0, token1: $token1 }) {
      pairCount
      totalVolumeUSD
      totalLiquidityUSD
    }
  }
`;

export default GET_AGGREGATED_UNISWAP_DATA;
