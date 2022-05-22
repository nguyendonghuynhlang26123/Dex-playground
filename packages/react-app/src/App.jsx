import { useNotifications } from '@usedapp/core';
import React, { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import Exchange from './pages/Exchange';
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
    <div
      id="global"
      style={{
        backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2)), url(${process.env.PUBLIC_URL + '/img/bg2.jpg'})`,
      }}
    >
      <Header paths={paths} />

      <div id="main" className="flex justify-center items-start py-12">
        <div className="w-[560px] px-4">
          <Routes>
            <Route path="token" element={<TokensManagement />} />
            <Route path="swap" element={<Swaps />} />
            <Route path="liquidity" element={<LiquidityPage />} />
            <Route path="/" element={<Navigate to="/exchange" />} />
            <Route path="protocol" element={<Protocols />} />
            <Route path="exchange" element={<Exchange />} />
          </Routes>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default App;
