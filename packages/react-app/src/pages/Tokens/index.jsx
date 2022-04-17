import React from 'react';

import { addresses } from '@dex/contracts';
import { Token } from '../../components/Token';
const TokensManagement = () => {
  const { one, two } = addresses['4'];
  return (
    <div>
      <Token address={one} title="Token ONE" />
      <hr />
      <Token address={two} title="Token TWO" />
      <hr />
    </div>
  );
};

export default TokensManagement;
