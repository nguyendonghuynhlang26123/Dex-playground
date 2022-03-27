import { shortenAddress, useCall, useEthers, useLookupAddress, useEtherBalance, useNotifications } from '@usedapp/core';
import React, { useEffect, useState } from 'react';
import { Swap } from './components/Swap';

import { formatEther } from '@ethersproject/units';
import { toast } from 'react-toastify';
import { Token } from './components/Token';
import { prettyNum } from './common/utils';
import { addresses } from '@dex/contracts';
import { Liquidity } from './components/Liquidity';
import { envConfig } from './common/config';

function WalletButton() {
  const { account, chainId, activateBrowserWallet, deactivate, error } = useEthers();

  useEffect(() => {
    if (error) {
      console.error('Error while connecting wallet:', error.message);
      alert(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (chainId && !envConfig.allowNetworks.includes(chainId)) {
      toast.error('Not support this chain, please switch to Rinkeby network');
    }
  }, [chainId]);
  return account ? (
    <button
      className="hover:bg-red-200 hover:font-bold border border-red-500 text-red-500 rounded px-2 py-1 my-2 "
      onClick={() => {
        deactivate();
      }}
    >
      Disconnect
    </button>
  ) : (
    <button
      className="hover:bg-blue-200 hover:font-bold border border-blue-500 text-blue-500 rounded px-2 py-1 my-2"
      onClick={() => {
        activateBrowserWallet();
      }}
    >
      Connect
    </button>
  );
}

function App() {
  const [rendered, setRendered] = useState('');
  const [swapReversed, setSwapReversed] = useState(false);
  const ens = useLookupAddress();
  const { account, error, active } = useEthers();
  const balance = useEtherBalance(account);
  const { notifications } = useNotifications();
  const { one, two } = addresses['4'];
  useEffect(() => {
    if (ens) {
      setRendered(ens);
    } else if (account) {
      setRendered(shortenAddress(account));
    } else {
      setRendered('');
    }
  }, [account, ens, setRendered]);

  useEffect(() => {
    if (error) {
      console.error('Error while connecting wallet:', error.message);
      alert(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      notifications.forEach((n) => {
        if (n.type === 'walletConnected') toast.info(`Wallet connect`);
        else if (n.type === 'transactionSucceed') toast.success(n.transactionName);
        else {
          console.log('Notification: ', n);
        }
      });
    }
  }, [notifications]);

  const swapPositionBtn = (ev) => {
    ev.preventDefault();
    setSwapReversed((prv) => !prv);
  };

  return (
    <div className="w-[560px] mx-auto px-4 my-4">
      <div className="flex items-start justify-between">
        {rendered ? (
          <div className="flex flex-col items-start">
            {account && <p>Account: {rendered}</p>}
            {balance && <p>Ether balance: {prettyNum(balance)} ETH </p>}
          </div>
        ) : (
          <span></span>
        )}
        <WalletButton />
      </div>
      {active && (
        <>
          <hr />
          <Token address={one} title="Token ONE" />
          <hr />
          <Token address={two} title="Token TWO" />
          <hr />
          {swapReversed ? (
            <Swap token1Address={two} token2Address={one} swapPosition={swapPositionBtn} />
          ) : (
            <Swap token1Address={one} token2Address={two} swapPosition={swapPositionBtn} />
          )}
          <hr />
          <Liquidity />
        </>
      )}
    </div>
  );
}

export default App;
