import { abis, addresses } from '@dex/contracts';
import { useContractFunction, useEthers, useTokenAllowance } from '@usedapp/core';
import { BigNumber, FixedNumber } from 'ethers';
import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { calculateShare, getContract, prettyNum } from '../../common/utils';
import { useApprove } from '../../hooks';
import { TransactionButton } from '../TransactionButtons';

export const RemoveLiquidity = ({ token0, token1, token0Address, token1Address, r0, r1, totalLPToken, lpAmount }) => {
  const { account, library } = useEthers();
  const routerAddress = addresses[4].router;
  const poolAddress = addresses[4].pair;

  // User must approve the contract first to deposit lp token
  const lpTokenAllowance = useTokenAllowance(poolAddress, account, routerAddress);
  const [approvalState, approveLpToken] = useApprove(poolAddress, routerAddress, 'Token Approved');

  // Slider
  const [slideValue, setSlideValue] = useState(0);

  // Provide liquidity function
  const routerContract = getContract(abis.router, routerAddress, library);
  const { state: removeState, send: submitRemoveLiquidity } = useContractFunction(routerContract, 'removeLiquidity', {
    transactionName: 'Remove liquidity successfully',
  });

  // LP token
  const lpDesired = useMemo(() => (lpAmount && slideValue ? calculateShare(lpAmount, slideValue) : '0'), [lpAmount, slideValue]);

  // calculate total amount of user's token in pool
  const shareInPool = useMemo(
    () => (lpAmount && totalLPToken ? FixedNumber.from(lpAmount.mul(100)).divUnsafe(FixedNumber.from(totalLPToken)).toString() : '0'),
    [lpAmount, totalLPToken]
  );
  const balance0Max = useMemo(() => (r0 && shareInPool ? calculateShare(r0, shareInPool) : '0'), [r0, shareInPool]);
  const balance1Max = useMemo(() => (r1 && shareInPool ? calculateShare(r1, shareInPool) : '0'), [r1, shareInPool]);

  // slider% in total balance user have will be calculated
  const balance0Received = useMemo(() => (balance0Max && slideValue ? calculateShare(balance0Max, slideValue) : '0'), [balance0Max, slideValue]);
  const balance1Received = useMemo(() => (balance1Max && slideValue ? calculateShare(balance1Max, slideValue) : '0'), [balance1Max, slideValue]);

  // Other
  const slippage = useSelector((state) => state.slippage.value);
  const { value: deadline, toSec } = useSelector((state) => state.deadline);

  const removeLiquidity = useCallback(
    (ev) => {
      ev.preventDefault();
      const amountMin0 = BigNumber.from(balance0Received) // (100 - slippage)%
        .mul(10000 - slippage * 100)
        .div(10000);
      const amountMin1 = BigNumber.from(balance1Received) // (100 - slippage)%
        .mul(10000 - slippage * 100)
        .div(10000);
      const dl = Math.floor(Date.now() / 1000) + deadline * toSec;
      submitRemoveLiquidity(token0Address, token1Address, lpDesired, amountMin0, amountMin1, account, dl);
    },
    [balance0Received, balance1Received, slippage, deadline, toSec, submitRemoveLiquidity, token0Address, token1Address, lpDesired, account]
  );

  return (
    <div className="my-2">
      <p className="text-2xl">{slideValue}%</p>
      <input type="range" min="1" max="100" value={slideValue} onChange={(ev) => setSlideValue(ev.target.value)} className="w-full" />

      <hr />
      <div className="my-2">
        <span className="flex flex-row justify-between">
          <p className="font-bold">Burned:</p>
          <p>
            {prettyNum(lpDesired)}/{prettyNum(lpAmount)} LP token
          </p>
        </span>
        <span className="flex flex-row justify-between">
          <p className="font-bold">Received:</p>
          <p>
            {`${prettyNum(balance0Received)} ${token0.symbol}`} / {`${prettyNum(balance1Received)} ${token1.symbol}`}
          </p>
        </span>
      </div>

      <div className="flex flex-row space-x-4">
        {lpTokenAllowance && lpTokenAllowance.isZero() && (
          <TransactionButton
            label={`Approve`}
            onClick={() => approveLpToken()}
            state={approvalState}
            className={`flex-1 mt-2 !bg-white !text-blue-500 border border-blue-500 hover:!bg-blue-300 hover:!border-blue-300 hover:!text-white`}
          />
        )}

        <TransactionButton
          onClick={removeLiquidity}
          className="mt-2 flex-1"
          state={removeState}
          label="Remove"
          disabled={lpTokenAllowance && lpTokenAllowance.isZero()}
        />
      </div>
    </div>
  );
};
