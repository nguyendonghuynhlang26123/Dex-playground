import React, { useState } from 'react';
import { Liquidity } from '../../components/Liquidity';
import { abis, addresses } from '@dex/contracts';
import { useEthers } from '@usedapp/core';
import { getContract } from '../../common/utils';
import { OptionDropDown } from '../../components/Dropdown';

const LiquidityPage = () => {
  const { library: provider } = useEthers();
  const [pair, setPair] = useState([addresses[4].one, addresses[4].two]);
  const [pairContractAddress, setPairContractAddress] = useState(addresses[4].pair);
  const factoryContract = getContract(abis.factory, addresses[4].factory, provider);

  // In real production, we should let user define which pool they want to interact with.
  // But again, in our project this is not important
  const poolOptions = [
    {
      id: 1,
      title: 'ONE / TWO',
      value: [addresses[4].one, addresses[4].two],
    },
    {
      id: 2,
      title: 'WETH / ONE',
      value: [addresses[4].weth, addresses[4].one],
    },
    {
      id: 3,
      title: 'WETH / TWO',
      value: [addresses[4].weth, addresses[4].two],
    },
  ];

  const handleChangePair = async (pair) => {
    const pairAddress = await factoryContract.getPair(pair[0], pair[1]);
    if (pairAddress !== '0x0000000000000000000000000000000000000000') {
      setPairContractAddress(pairAddress);
      setPair(pair);
    }
  };

  return (
    <>
      <OptionDropDown options={poolOptions} onSelect={(option) => handleChangePair(option.value)} />
      {pair[0] && pair[1] && pairContractAddress ? (
        <Liquidity token0Address={pair[0]} token1Address={pair[1]} pairAddress={pairContractAddress} />
      ) : (
        <> Loading...</>
      )}
    </>
  );
};

export default LiquidityPage;
