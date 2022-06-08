import React, { useCallback, useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { ethers, BigNumber } from 'ethers';
import { TokenUtils } from '../../common/TokenUtils';
import { getContract, prettyNum } from '../../common/utils';
import { TransactionButton } from '../TransactionButtons';
import { abis, addresses } from '@dex/contracts';
import { useContractFunction } from '@usedapp/core';
import { Tag } from './Tag';
import { LoadingPlaceHolder } from '../LoadingPlaceHolder';

export const OpenOrderCard = ({ provider, order, handleClick }) => {
  const abiEncoder = new ethers.utils.AbiCoder();

  const inputAddress = order.inputToken;
  const inputAmount = BigNumber.from(order.amount);
  const createdAt = moment(new Date(order.updatedAt * 1000)).fromNow();
  const [outputAddress, outputAmount, maxOutputAmount] = abiEncoder.decode(['address', 'uint256', 'uint256'], order.data);

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
    return () => {
      setInputToken(null);
      setOutputToken(null);
    };
  }, [inputAddress, outputAddress]);

  const submitCancelOrder = useCallback(() => {
    cancelOrderTx(order.module, order.inputToken, order.owner, order.witness, order.amount, order.data);
  }, [order]);

  const onClickHandler = useCallback(
    (ev) => {
      ev.preventDefault();
      handleClick({
        inputAddress,
        outputAddress,
        inputAmount,
        outputAmount,
        maxOutputAmount,
      });
    },
    [inputAddress, outputAddress, inputAmount, outputAmount, maxOutputAmount]
  );

  return (
    <li className="p-4 hover:shadow cursor-pointer hover:bg-sky-100 grid grid-cols-4 gap-2 " onClick={onClickHandler}>
      {inputToken && outputToken ? (
        <>
          <Tag img={inputToken.imageUrl} symbol={inputToken.symbol} amount={prettyNum(inputAmount)} />
          {/* <HiOutlineArrowNarrowRight /> */}
          <Tag img={outputToken.imageUrl} symbol={outputToken.symbol} amount={prettyNum(outputAmount)} />
          <p className="text-sm text-gray-500 justify-center flex items-center ">{createdAt}</p>
          <div className="flex justify-center items-center">
            <TransactionButton
              label="Cancel"
              className="text-sm rounded-3xl tracking-tight py-0.5 px-3 !btn-warning !shadow-none"
              state={cancelingState}
              onClick={submitCancelOrder}
            />
          </div>
        </>
      ) : (
        <LoadingPlaceHolder className="mx-auto col-span-4" />
      )}
    </li>
  );
};
