import { useQuery } from '@apollo/client';
import { addresses } from '@dex/contracts';
import { useEthers } from '@usedapp/core';
import React, { useMemo, useState } from 'react';
import { GET_ORDERS_BY_USER_AND_MODULE } from '../../graphql/subgraph';
import { OpenOrderCard } from './OpenOrderCard';

export const OrderContainer = () => {
  const { account, library } = useEthers();
  const { loading, error, data } = useQuery(GET_ORDERS_BY_USER_AND_MODULE, {
    variables: { account: account?.toLowerCase(), module: addresses[4].limitOrderModule },
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
    <div className=" flex flex-col mt-8 bg-gray-100 rounded-3xl h-48">
      <ul>
        <li>
          <button
            // className =   { selectedItem===1 ? 'mx-3 p-2  px-4  rounded-3xl hover:bg-blue-400 hover:text-white active:bg-blue-400 active:text-white focus:bg-blue-400 focus:text-white' : 'text-black'}
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
      <hr></hr>

      {selectedItem === 1 ? (
        <OrderContainer />
      ) : selectedItem === 2 ? (
        <h1 className="text-center mt-2"> Cancelled</h1>
      ) : selectedItem === 3 ? (
        <h1 className="text-center mt-2"> Executed</h1>
      ) : (
        <></>
      )}
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
