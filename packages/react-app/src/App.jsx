import { shortenAddress, useEthers, useLookupAddress, useEtherBalance, useNotifications } from '@usedapp/core';
import React, { useEffect, useState } from 'react';
import { Swap } from './components/Swap';

import { toast } from 'react-toastify';
import { prettyNum } from './common/utils';
import { addresses } from '@dex/contracts';
import { envConfig } from './common/config';
import { Link, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import TokensManagement from './pages/Tokens';
import Swaps from './pages/Swap';
import LiquidityPage from './pages/Liquidity';
import Protocols from './pages/Protocol';
import { SwapConfig } from './components/SwapConfig';

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
  const ens = useLookupAddress();
  const { account, error } = useEthers();
  const balance = useEtherBalance(account);
  const { notifications } = useNotifications();
  const { pathname } = useLocation();

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
  return (
    <div className="w-[560px] mx-auto px-4 my-4 ">
      <div className="flex items-start justify-between my-2">
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
      <hr />
      <SwapConfig />
      <hr />
      <ul>
        <li className="flex flex-row justify-center items-center space-x-2 my-2">
          <Link className={`px-2 hover:underline ${pathname === '/token' && 'font-bold text-blue-500'}`} to="/token">
            Token
          </Link>
          <Link className={`px-2 hover:underline ${pathname === '/swap' && 'font-bold text-blue-500'}`} to="/swap">
            Swap
          </Link>
          <Link className={`px-2 hover:underline ${pathname === '/liquidity' && 'font-bold text-blue-500'}`} to="/liquidity">
            Liquidity
          </Link>
          <Link className={`px-2 hover:underline ${pathname === '/protocol' && 'font-bold text-blue-500'}`} to="/protocol">
            Protocol
          </Link>
        </li>
      </ul>
      <hr />

      <Routes>
        <Route path="token" element={<TokensManagement />} />
        <Route path="swap" element={<Swaps />} />
        <Route path="liquidity" element={<LiquidityPage />} />
        <Route path="/" element={<Navigate to="/swap" />} />
        <Route path="protocol" element={<Protocols />} />
      </Routes>
    </div>
  );
}

export default App;
