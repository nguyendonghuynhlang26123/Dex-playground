import React, { useState } from 'react';
import { Swap } from '../../components/Swap';
import { addresses } from '@dex/contracts';
import { useEthers } from '@usedapp/core';
import { NewSwap } from '../../components/Swap/NewSwap';

const Swaps = () => {
  const { active } = useEthers();

  return (
    <div>
      {active && (
        <>
          <NewSwap />
        </>
      )}
    </div>
  );
};

export default Swaps;
