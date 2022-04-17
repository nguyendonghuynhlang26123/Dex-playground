import React from 'react';
import { Liquidity } from '../../components/Liquidity';
import { addresses } from '@dex/contracts';

const LiquidityPage = () => {
  return (
    <Liquidity token0Address={addresses[4].one} token1Address={addresses[4].two} pairAddress={addresses[4].pair} />
  );
};

export default LiquidityPage;
