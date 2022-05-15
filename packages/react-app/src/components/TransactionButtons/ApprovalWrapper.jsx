import React, { useEffect, useMemo } from 'react';
import { constants } from 'ethers';
import { useEthers, useToken, useTokenAllowance } from '@usedapp/core';
import { TransactionButton } from './TransactionButton';
import { useApprove } from '../../hooks';
import { RiLoader4Fill } from 'react-icons/ri';

const MAX_APPROVE = constants.MaxInt256;
export const ApprovalWrapper = ({ tokenAddress, target, amountToApprove = MAX_APPROVE, children }) => {
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
          onClick={(ev) => {
            ev.preventDefault();
            approveToken();
          }}
          state={approvalState}
          className={`mt-2 mx-2.5 !py-3 !rounded-[1rem] !bg-white !text-blue-500 border border-blue-500 hover:!bg-blue-300 hover:!border-blue-300 hover:!text-white`}
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