import { useQuery } from '@apollo/client';
import { addresses } from '@dex/contracts';
import { useEthers } from '@usedapp/core';
import React, { useMemo, useState } from 'react';
import { GET_ORDERS_BY_USER_AND_MODULE } from '../../graphql/subgraph';
import { OpenOrderCard } from './OpenOrderCard';

export const OrderContainer = () => {
  const { account, library } = useEthers();
  const { loading, error, data } = useQuery(GET_ORDERS_BY_USER_AND_MODULE, {
    variables: { account: account ? account.toLowerCase() : '', module: addresses[4].limitOrderModule },
    pollInterval: 5000,
  });

  const [selectedItem, setSelectedItem] = useState(1);
  const openOrders = useMemo(() => {
    if (data && data.orders) {
      return data.orders.filter((o) => o.status === 'open');
    }
    return [];
  }, [data]);

  return (
    <div className="relative mt-4 bg-sky-100/90 shadow-lg rounded-3xl px-2 py-4 border-sky-900/50 border-2">
      <ul>
        <li>
          <button
            className={
              selectedItem === 1
                ? 'm-3 mx-3 p-2  px-4  rounded-3xl  bg-blue-400 text-white'
                : ' m-3 mx-3 p-2  px-4  rounded-3xl  text-black hover:bg-blue-400 hover:text-white'
            }
            onClick={() => setSelectedItem(1)}
          >
            Open Order
          </button>
          <button
            className={
              selectedItem === 2
                ? 'm-3 mx-3 p-2  px-4  rounded-3xl  bg-blue-400 text-white'
                : 'm-3 mx-3 p-2  px-4  rounded-3xl  text-black hover:bg-blue-400 hover:text-white'
            }
            onClick={() => setSelectedItem(2)}
          >
            Cancelled
          </button>
          <button
            className={
              selectedItem === 3
                ? 'm-3 mx-3 p-2  px-4  rounded-3xl  bg-blue-400 text-white'
                : 'm-3 mx-3 p-2  px-4  rounded-3xl  text-black hover:bg-blue-400 hover:text-white'
            }
            onClick={() => setSelectedItem(3)}
          >
            Executed
          </button>
        </li>
      </ul>

      <div className="h-48 overflow-auto bg-sky-50 rounded-xl mx-2">
        {selectedItem === 1 ? (
          <div className="divide-y divide-gray-300">
            {openOrders.map((order, i) => (
              <OpenOrderCard key={i} order={order} provider={library} />
            ))}
          </div>
        ) : selectedItem === 2 ? (
          <h1 className="text-center mt-2"> Cancelled</h1>
        ) : selectedItem === 3 ? (
          <h1 className="text-center mt-2"> Executed</h1>
        ) : (
          <></>
        )}
      </div>
    </div>
  );

  // return !loading ? (
  //   <div>
  //     {openOrders.map((order, i) => (
  //       <OpenOrderCard key={i} order={order} provider={library} />
  //     ))}
  //   </div>
  // ) : (
  //   <>Loading...</>
  // );
};
