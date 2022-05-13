import React, { useState } from 'react';
import { Swap } from '../../components/Swap';
import { addresses } from '@dex/contracts';
import { useEthers } from '@usedapp/core';
import { Protocol } from '../../components/Protocol';
// import '../../components/Protocol/index.css';

const Protocols = () => {
  const { active } = useEthers();
  const { one, two } = addresses['4'];
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
            <Protocol token0Address={two} token1Address={one} swapPosition={swapPositionBtn} />
          ) : (
            <Protocol token0Address={one} token1Address={two} swapPosition={swapPositionBtn} />
          )}
          <hr />
        </>
      )}
    </div>
  );
};

export default Protocols;
