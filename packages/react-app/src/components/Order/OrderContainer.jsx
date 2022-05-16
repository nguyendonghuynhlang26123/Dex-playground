import { useQuery } from '@apollo/client';
import { addresses } from '@dex/contracts';
import { useEthers } from '@usedapp/core';
import React, { useMemo } from 'react';
import { GET_ORDERS_BY_USER_AND_MODULE } from '../../graphql/subgraph';
import { OpenOrderCard } from './OpenOrderCard';

export const OrderContainer = () => {
  const { account, library } = useEthers();
  const { loading, error, data } = useQuery(GET_ORDERS_BY_USER_AND_MODULE, {
    variables: { account: account?.toLowerCase(), module: addresses[4].limitOrderModule },
    pollInterval: 5000,
  });
  const openOrders = useMemo(() => {
    if (data && data.orders) {
      return data.orders.filter((o) => o.status === 'open');
    }
    return [];
  }, [data]);

  return !loading ? (
    <div>
      {openOrders.map((order, i) => (
        <OpenOrderCard key={i} order={order} provider={library} />
      ))}
    </div>
  ) : (
    <>Loading...</>
  );
};
