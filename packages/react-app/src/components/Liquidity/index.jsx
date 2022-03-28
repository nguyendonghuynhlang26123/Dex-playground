import { abis, addresses } from '@dex/contracts';
import React from 'react';
import { useLiquidityReserve } from '../../hooks';
import { NoLiquidity } from './NoLiquidity';
import { HasLiquidity } from './HasLiquidity';

export const Liquidity = () => {
  const { active, r0, r1 } = useLiquidityReserve(addresses[4].pair, addresses[4].two, addresses[4].one);
  const hasLiquidity = (a, b) => !a.isZero() && !b.isZero();
  return active ? (
    <>{r0 && r1 && hasLiquidity(r0, r1) ? <HasLiquidity r0={r0} r1={r1} /> : <NoLiquidity />}</>
  ) : (
    <p>Loading...</p>
  );
};
