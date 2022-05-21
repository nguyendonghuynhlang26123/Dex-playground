import { useNotifications } from '@usedapp/core';
import React, { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Header } from './components/Header';
import LiquidityPage from './pages/Liquidity';
import Protocols from './pages/Protocol';
import Swaps from './pages/Swap';
import TokensManagement from './pages/Tokens';

function App() {
  const { notifications } = useNotifications();
  const { pathname } = useLocation();
  const paths = ['exchange', 'playground'];

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
    <div className=" ">
      <Header paths={paths} />
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
      <div className="w-[560px] mx-auto px-4 my-4">
        <Routes>
          <Route path="token" element={<TokensManagement />} />
          <Route path="swap" element={<Swaps />} />
          <Route path="liquidity" element={<LiquidityPage />} />
          <Route path="/" element={<Navigate to="/swap" />} />
          <Route path="protocol" element={<Protocols />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
