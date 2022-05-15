import React, { useCallback, useEffect, useMemo, useState } from 'react';
import TokenIcon from '../../assets/images/token.png';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { CollapsePanel } from '../CollapsePanel';
import { ethers } from 'ethers';
import { TokenUtils } from '../../common/TokenUtils';
import { getContract, prettyNum } from '../../common/utils';
import { TransactionButton } from '../TransactionButtons';
import { abis, addresses } from '@dex/contracts';
import { useContractFunction } from '@usedapp/core';

const Tag = ({ amount, img, symbol }) => {
  return (
    <button className="flex flex-row gap-1 items-center rounded-full py-1 px-3 bg-white border border-gray-300 text-sm" onClick={(ev) => ev.preventDefault()}>
      <img
        src={img}
        className="w-4 h-4"
        onError={({ currentTarget }) => {
          currentTarget.onerror = null; // prevents looping
          currentTarget.src = TokenIcon;
        }}
      />
      <span>
        {amount} {symbol}
      </span>
    </button>
  );
};

export const OpenOrderCard = ({ provider, order }) => {
  const abiEncoder = new ethers.utils.AbiCoder();

  const inputAddress = order.inputToken;
  const inputAmount = order.amount;
  const [outputAddress, outputAmount] = abiEncoder.decode(['address', 'uint256'], order.data);

  const [inputToken, setInputToken] = useState();
  const [outputToken, setOutputToken] = useState();

  // Canceling order:
  const coreContract = getContract(abis.coreProtocol, addresses[4].coreProtocol, provider);
  const { state: cancelingState, send: cancelOrderTx } = useContractFunction(coreContract, 'cancelOrder', {
    transactionName: 'Successfully cancel order',
  });

  useEffect(() => {
    if (inputAddress) TokenUtils.getTokenInfo(provider, inputAddress).then(setInputToken);
    if (outputAddress) TokenUtils.getTokenInfo(provider, outputAddress).then(setOutputToken);
  }, [inputAddress, outputAddress]);

  const submitCancelOrder = useCallback(() => {
    console.log('Cancel param: ', order.module, order.inputToken, order.owner, order.witness, order.amount, order.data);
    cancelOrderTx(order.module, order.inputToken, order.owner, order.witness, order.amount, order.data);
  }, [order]);

  return (
    <div className="my-2 p-4 rounded-[1rem] bg-gray-50 border border-gray-300 ">
      {inputToken && outputToken && (
        <div className=" flex flex-row justify-between">
          <div className="flex flex-row items-center gap-2">
            <Tag img={inputToken.imageUrl} symbol={inputToken.symbol} amount={prettyNum(inputAmount)} />
            <HiOutlineArrowNarrowRight />

            <Tag img={outputToken.imageUrl} symbol={outputToken.symbol} amount={prettyNum(outputAmount)} />
          </div>
          <TransactionButton
            label="Cancel"
            className="rounded-[1rem] py-0.5 px-3 text-yellow-700 !bg-yellow-100 border border-yellow-300 hover:!bg-yellow-200"
            state={cancelingState}
            onClick={submitCancelOrder}
          >
            Cancel
          </TransactionButton>
        </div>
      )}
    </div>
  );
};
