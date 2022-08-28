import { Tab, Transition } from '@headlessui/react';
import { useEthers } from '@usedapp/core';
import React, { useEffect, useState } from 'react';
import { Swap } from '../../components/Swap';
import { classNames } from '../../common/utils';
import { ConfigButton } from '../../components/SwapConfig/ConfigButton';
import { Protocol } from '../../components/Protocol';
import { OrderContainer } from '../../components/Order/OrderContainer';
import { MdOutlineAccountBalanceWallet } from 'react-icons/md';
import { envConfig, networkNames } from '../../common/config';
import { LiquidityPage } from '../Liquidity';

const Exchange = () => {
  const { account, chainId, library: provider } = useEthers();
  const [selectedIndex, setSelectedIndex] = useState(1);

  const options = ['Swap', 'Order', 'Liquidity'];
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!account) setConnectionError('Please connect to your wallet to use the service');
    else if (chainId && !envConfig.allowNetworks.includes(chainId)) {
      const supportChainNames = envConfig.allowNetworks.map((id) => networkNames[id]);
      setConnectionError('This chain is not supported! Please switch to the following chains: ' + supportChainNames.join(', '));
    } else setConnectionError(null);
  }, [account, chainId]);

  return (
    <Transition
      show={provider !== undefined}
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-sky-200 rounded-3xl  " />
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex} as="div" className=" relative bg-sky-100/90 shadow-lg rounded-3xl px-2 py-4  ">
          <div className="flex-row-center justify-between">
            <Tab.List as="div" className="flex-row-center mx-2 flex space-x-1 rounded-xl bg-sky-400/20 p-1 ">
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

            <div className="mx-2">
              <ConfigButton />
            </div>
          </div>

          {connectionError ? (
            <div className="flex justify-center items-center h-64 flex-col gap-1 text-sky-400">
              <MdOutlineAccountBalanceWallet className="h-20 w-20 " />
              <p className="text-center px-6">{connectionError}</p>
            </div>
          ) : (
            <Tab.Panels>
              <Tab.Panel>
                <Swap />
              </Tab.Panel>
              <Tab.Panel>
                <Protocol />
              </Tab.Panel>
              <Tab.Panel>
                <LiquidityPage />
              </Tab.Panel>
            </Tab.Panels>
          )}
        </Tab.Group>
      </div>

      {selectedIndex === 1 && !connectionError ? (
        <div className="relative">
          <div className="absolute inset-0 bg-sky-200 rounded-3xl " />
          <OrderContainer />
        </div>
      ) : (
        <div></div>
      )}
    </Transition>
  );
};

export default Exchange;
