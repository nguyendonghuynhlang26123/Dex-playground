import React, { useState } from 'react';
import { Swap } from '../../components/Swap';
import { addresses } from '@dex/contracts';
import { useEthers } from '@usedapp/core';

const Swaps = () => {
  const { active } = useEthers();
  const { one, two } = addresses['4'];
  const [token1Address, setToken1Address] = useState(false);
  const [swapReversed, setSwapReversed] = useState(false);
  const swapPositionBtn = (ev) => {
    ev.preventDefault();
    setSwapReversed((prv) => !prv);
  };

  return (
    <div>
      {active && (
        <>
          {swapReversed ? (
            <Swap token0Address={two} token1Address={one} swapPosition={swapPositionBtn} />
          ) : (
            <Swap token0Address={one} token1Address={two} swapPosition={swapPositionBtn} />
          )}
          <hr />
        </>
      )}
    </div>
  );
};

export default Swaps;
