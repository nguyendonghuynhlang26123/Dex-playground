import React from 'react';

import { addresses } from '@dex/contracts';
import { Token, Weth } from '../../components/Token';
const TokensManagement = () => {
  const { one, two, three, four, weth } = addresses[137];

  return (
    <div className="relative bg-sky-100/90 shadow-lg rounded-3xl px-4 py-4 ">
      <Token address={one} title="Token ONE" />
      <hr />
      <Token address={two} title="Token TWO" />
      <hr />
      <Token address={three} title="Token THREE" />
      <hr />
      <Token address={four} title="Token FOUR" />
      <hr />
      <Weth address={weth} />
      <hr />
    </div>
  );
};

export default TokensManagement;
