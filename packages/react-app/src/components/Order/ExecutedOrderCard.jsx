import React, { useCallback, useEffect, useMemo, useState } from 'react';
import VisibilitySensor from 'react-visibility-sensor';
import { ethers, BigNumber } from 'ethers';
import { TokenUtils } from '../../common/TokenUtils';
import { formatDate, prettyNum } from '../../common/utils';
import { Tag } from './Tag';
import moment from 'moment';
import { LoadingPlaceHolder } from '../LoadingPlaceHolder';

export const ExecutedOrderCard = ({ provider, order, isNew, onVisible }) => {
  const abiEncoder = new ethers.utils.AbiCoder();

  const receivedAmount = order.bought;
  const executedAt = moment(new Date(order.updatedAt * 1000)).fromNow();
  const inputAddress = order.inputToken;
  const inputAmount = BigNumber.from(order.amount);
  const [outputAddress, outputAmount] = abiEncoder.decode(['address', 'uint256'], order.data);

  const [inputToken, setInputToken] = useState();
  const [outputToken, setOutputToken] = useState();

  useEffect(() => {
    if (inputAddress) TokenUtils.getTokenInfo(provider, inputAddress).then(setInputToken);
    if (outputAddress) TokenUtils.getTokenInfo(provider, outputAddress).then(setOutputToken);
  }, [inputAddress, outputAddress]);

  const handleOrderInViewPort = (isVisible) => {
    if (isVisible) {
      onVisible(order);
    }
  };
  useEffect(() => {
    onVisible(order);
  }, []);

  return (
    <li className="px-2 py-4 grid grid-cols-4 gap-2">
      {inputToken && outputToken ? (
        <>
          <Tag img={inputToken.imageUrl} symbol={inputToken.symbol} amount={prettyNum(inputAmount)} />
          <Tag img={outputToken.imageUrl} symbol={outputToken.symbol} amount={prettyNum(outputAmount)} />
          <Tag img={outputToken.imageUrl} symbol={outputToken.symbol} amount={prettyNum(receivedAmount)} />
          <p className="text-sm text-gray-500 text-right">
            {isNew && <span className="text-sm text-red-500 mx-1 px-2 rounded-full border border-red-500">New!</span>}
            <a href={'https://rinkeby.etherscan.io/tx/' + order.executedTxHash} className="underline cursor-pointer hover:text-sky-500">
              View tx
            </a>
            <br />
            {executedAt}
          </p>
        </>
      ) : (
        <LoadingPlaceHolder className="col-span-4 mx-auto" />
      )}
    </li>
  );
};
