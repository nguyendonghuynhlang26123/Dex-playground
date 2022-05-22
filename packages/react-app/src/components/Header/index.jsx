import { shortenAddress, useEtherBalance, useEthers, useLookupAddress } from '@usedapp/core';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { prettyNum } from '../../common/utils';
import { WalletButton } from './WalletButton';

export const Header = ({ paths }) => {
  const { account, error } = useEthers();
  const [rendered, setRendered] = useState('');
  const ens = useLookupAddress();
  const balance = useEtherBalance(account);
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

  return (
    <nav id="header" className="w-full flex items-center justify-between px-4 shadow bg-gradient-to-r from-sky-900/20 to-sky-900/20">
      <div className="flex gap-4">
        <div className="flex gap-1 items-center ">
          <p className="text-2xl align-text-bottom -mt-2">🌊</p>
          <p className="logo  align-text-bottom text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-sky-100 to-sky-500">Aqua.finance</p>
        </div>

        <ul className="flex flex-row justify-center items-center space-x-1 my-2">
          {paths?.map((path, i) => (
            <li className="" key={i}>
              <Link
                className={`px-2 capitalize font-bold text-sky-200/60  ${pathname === '/' + path ? 'text-sky-200' : 'hover:text-sky-200/80'}`}
                to={'/' + path}
              >
                {path}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-row items-center gap-2 ">
        {/* <div className="text-sky-200">Rinkeby</div> */}
        {rendered && balance && (
          <div className="flex items-center gap-2 border rounded-[0.5rem] pl-2 h-8 bg-sky-100 border-sky-200">
            <span>{prettyNum(balance, null, 0) + ' ETH'}</span>
            <button className="px-2 py-0.5   btn-primary-light">{rendered}</button>
          </div>
        )}
        <WalletButton />
      </div>
    </nav>
  );
};
