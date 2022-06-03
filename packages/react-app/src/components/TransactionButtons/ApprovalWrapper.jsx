import React, { useEffect, useMemo } from 'react';
import { constants } from 'ethers';
import { useEthers, useToken, useTokenAllowance } from '@usedapp/core';
import { TransactionButton } from './TransactionButton';
import { useApprove } from '../../hooks';
import { RiLoader4Fill } from 'react-icons/ri';

const MAX_APPROVE = constants.MaxUint256;
export const ApprovalWrapper = ({ tokenAddress, target, amountToApprove = constants.MaxInt256, children }) => {
  const { account } = useEthers();

  const token = useToken(tokenAddress);
  const allowance = useTokenAllowance(tokenAddress, account, target);
  const [approvalState, approveToken] = useApprove(tokenAddress, target, 'Token Approved');
  const loadCompleted = useMemo(() => token && allowance && approveToken, [token, allowance, approveToken]);

  return loadCompleted ? (
    <>
      {token && allowance && allowance.lt(amountToApprove) ? (
        <TransactionButton
          label={`Approve ${token.symbol}`}
          onClick={approveToken}
          state={approvalState}
          className={`mt-2 mx-2.5 !py-3 !btn-success !rounded-[1rem]`}
        />
      ) : (
        <>{children}</>
      )}
    </>
  ) : (
    <button
      className=" flex justify-center items-center mt-2 mx-2.5 gap-1 py-3 bg-white border border-blue-500 opacity-80 text-blue-500 rounded-[1rem]"
      disabled
    >
      <RiLoader4Fill className="animate-spin spin-low" />
      Loading...
    </button>
  );
};
