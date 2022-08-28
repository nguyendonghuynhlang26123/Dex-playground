import React, { useCallback, useState } from 'react';
import { classNames, getContract } from '../../common/utils';
import { Protocol } from '../../components/Protocol';
import { Liquidity } from '../../components/Liquidity';
import { abis, addresses } from '@dex/contracts';
import { TokenPickerButton } from '../../components/TokenPicker';
import { useEthers } from '@usedapp/core';
import { CreatePool } from '../../components/Liquidity/CreatePool';

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const LiquidityComponent = ({ tokenAddress0, tokenAddress1, pairAddress, navigateToLP }) => {
  if (tokenAddress0 && tokenAddress1 && pairAddress) {
    if (pairAddress === NULL_ADDRESS) return <CreatePool token0Address={tokenAddress0} token1Address={tokenAddress1} navigateToLP={navigateToLP} />;
    return <Liquidity token0Address={tokenAddress0} token1Address={tokenAddress1} pairAddress={pairAddress} />;
  } else return <></>;
};

export const LiquidityPage = () => {
  const { account, chainId, library: provider } = useEthers();

  const [pair, setPair] = useState([null, null]);
  const [pairContractAddress, setPairContractAddress] = useState(addresses[137].pair);
  const factoryContract = getContract(abis.factory, addresses[137].factory, provider);

  const handleChangePair = async (pair) => {
    const pairAddress = await factoryContract.getPair(pair[0], pair[1]);
    setPairContractAddress(pairAddress);
  };

  const handleTokenSelect = (order, token) => {
    if (token) {
      let newPair = [...pair];
      newPair[order] = token.address;
      if (newPair[0] === newPair[1]) return;
      setPair(newPair);

      if (newPair[0] && newPair[1]) {
        handleChangePair(newPair);
      }
    }
  };

  const refetchScreen = useCallback(() => {
    if (pair && pair[0] && pair[1]) {
      handleChangePair(pair);
    }
  }, [pair]);

  return (
    <div className="mx-2 pt-2 min-h-48">
      <div className="flex flex-row py-2 gap-4 px-2">
        <TokenPickerButton
          provider={provider}
          account={account}
          tokenAddress={pair[0]}
          onTokenSelect={(token) => {
            handleTokenSelect(0, token);
          }}
          className="flex flex-row items-center justify-between rounded-t-xl py-2 px-4 bg-white border border-gray-200 hover:bg-gray-100 w-1/2 "
        />
        <TokenPickerButton
          provider={provider}
          account={account}
          tokenAddress={pair[1]}
          onTokenSelect={(token) => {
            handleTokenSelect(1, token);
          }}
          className="flex flex-row items-center justify-between rounded-t-xl py-2 px-4 bg-white border border-gray-200 hover:bg-gray-100 w-1/2 "
        />
      </div>

      <LiquidityComponent tokenAddress0={pair[0]} tokenAddress1={pair[1]} pairAddress={pairContractAddress} navigateToLP={refetchScreen} />
    </div>
  );
};
