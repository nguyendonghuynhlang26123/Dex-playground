import { useQuery } from '@apollo/client';
import { addresses } from '@dex/contracts';
import { parseEther } from '@ethersproject/units';
import { Tab } from '@headlessui/react';
import { useEthers } from '@usedapp/core';
import React, { useMemo, useState } from 'react';
import { classNames } from '../../common/utils';
import { GET_ORDERS_BY_USER_AND_MODULE } from '../../graphql/subgraph';
import { Modal } from '../Modal';
import { CanceledOrderCard } from './CanceledOrderCard';
import { ExecutedOrderCard } from './ExecutedOrderCard';
import { OpenOrderCard } from './OpenOrderCard';
import { OrderSummaryModal } from './OrderSummaryModal';

export const OrderContainer = () => {
  const { account, library } = useEthers();
  const [[address0, address1], setSelectedToken] = useState(['', '']);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { loading, error, data } = useQuery(GET_ORDERS_BY_USER_AND_MODULE, {
    variables: { account: account ? account.toLowerCase() : '', module: addresses[4].limitOrderModule },
    pollInterval: 5000,
  });

  const [selectedItem, setSelectedItem] = useState(0);
  const openOrders = useMemo(() => {
    if (data && data.orders) {
      return data.orders.filter((o) => o.status === 'open');
    }
    return [];
  }, [data]);
  const canceledOrders = useMemo(() => {
    if (data && data.orders) {
      return data.orders.filter((o) => o.status === 'open');
    }
    return [];
  }, [data]);
  const executedOrders = useMemo(() => {
    if (data && data.orders) {
      return data.orders.filter((o) => o.status === 'executed');
    }
    return [];
  }, [data]);

  const options = ['Open', 'Canceled', 'Executed'];

  const onClickHandle = (order) => {
    setSelectedOrder(order);
  };

  const closeOrderSummary = () => {
    setSelectedOrder(null);
  };

  return (
    <Tab.Group selectedIndex={selectedItem} onChange={setSelectedItem} as="div" className=" relative bg-sky-100/90 shadow-lg rounded-3xl px-2 py-4 mt-4 ">
      <div className="flex-row-center justify-between">
        <Tab.List as="div" className="flex-row-center mx-2 flex space-x-1 rounded-xl bg-sky-400/20 p-1 w-full ">
          {options.map((o, i) => (
            <Tab
              key={i}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-1.5 px-2 text-sm font-medium leading-5  ',
                  'ring-blue-400 ring-opacity-60 ring-offset ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected ? 'btn-primary hover:scale-100' : 'text-sky-600 hover:bg-sky-400/40 hover:text-sky-50'
                )
              }
            >
              {o}
            </Tab>
          ))}
        </Tab.List>
      </div>

      <Tab.Panels>
        <Tab.Panel>
          <ul className="rounded-lg bg-sky-50 h-48 overflow-auto mx-2 mt-4 divide-y divide-gray-300">
            <li className="grid grid-cols-4 gap-2 px-3 py-2 text-center text-sm tracking-tightest uppercase text-gray-500 font-semibold">
              <p>From</p>
              <p>To</p>
              <p>At</p>
              <p>Action</p>
            </li>
            {openOrders.map((order, i) => (
              <OpenOrderCard key={i} order={order} provider={library} handleClick={onClickHandle} />
            ))}
          </ul>
        </Tab.Panel>
        <Tab.Panel>
          <ul className="rounded-lg bg-sky-50 h-48 overflow-auto mx-2 mt-4 divide-y divide-gray-300">
            <li className="grid grid-cols-3 gap-2 px-3 py-2 text-center text-sm tracking-tightest uppercase text-gray-500 font-semibold">
              <p>From</p>
              <p>To</p>
              <p className="text-right">At</p>
            </li>
            {canceledOrders.map((order, i) => (
              <CanceledOrderCard key={i} order={order} provider={library} />
            ))}
          </ul>
        </Tab.Panel>
        <Tab.Panel>
          <ul className="rounded-lg bg-sky-50 h-48 overflow-auto mx-2 mt-4 divide-y divide-gray-300">
            <li className="grid grid-cols-4 gap-2 px-3 py-2 text-center text-sm tracking-tightest uppercase text-gray-500 font-semibold">
              <p>From</p>
              <p>To</p>
              <p>Received</p>
              <p className="text-right">At</p>
            </li>
            {executedOrders.map((order, i) => (
              <ExecutedOrderCard key={i} order={order} provider={library} />
            ))}
          </ul>
        </Tab.Panel>
      </Tab.Panels>

      <Modal isOpen={selectedOrder !== null} closeModal={closeOrderSummary} title="Order summary">
        <OrderSummaryModal {...selectedOrder} provider={library} account={account} factoryAddress={addresses[4].factory} />
      </Modal>
    </Tab.Group>
  );
};
