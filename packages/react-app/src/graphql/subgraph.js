import { gql } from '@apollo/client';

// See more example queries on https://thegraph.com/explorer/subgraph/uniswap/uniswap-v2
export const GET_ORDERS_BY_USER_AND_MODULE = gql`
  query userOrders($account: String!, $module: String!) {
    orders(where: { owner: $account, module: $module }) {
      id
      module
      inputToken
      owner
      witness
      amount
      secret
      data
      status

      bought
      handler
      auxData

      createdTxHash
      executedTxHash
      cancelledTxHash

      # Common data:
      createdAt
      updatedAt
    }
  }
`;
