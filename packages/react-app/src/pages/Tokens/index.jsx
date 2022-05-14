import React from 'react';

import { addresses } from '@dex/contracts';
import { Token, Weth } from '../../components/Token';
const TokensManagement = () => {
  const { one, two, weth } = addresses['4'];

  return (
    <div>
      <Token address={one} title="Token ONE" />
      <hr />
      <Token address={two} title="Token TWO" />
      <hr />
      <Weth address={weth} />
      <hr />
    </div>
  );
};

export default TokensManagement;
