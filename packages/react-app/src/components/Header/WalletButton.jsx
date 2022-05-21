import { useEthers } from '@usedapp/core';
import React, { useEffect } from 'react';
import { MdOutlineExitToApp } from 'react-icons/md';
import { toast } from 'react-toastify';
import { envConfig } from '../../common/config';

export const WalletButton = () => {
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
      className="btn-danger text-lg font-bold w-8 h-8 flex items-center justify-center"
      onClick={() => {
        deactivate();
      }}
    >
      <MdOutlineExitToApp />
    </button>
  ) : (
    <button
      className="btn-primary-light font-bold w-24 h-8 flex items-center justify-center"
      onClick={() => {
        activateBrowserWallet();
      }}
    >
      Connect
    </button>
  );
};
