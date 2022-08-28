import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { ethers, BigNumber } from 'ethers';
import { TokenUtils } from '../../common/TokenUtils';
import { formatDate, prettyNum } from '../../common/utils';
import { Tag } from './Tag';
import moment from 'moment';
import { LoadingPlaceHolder } from '../LoadingPlaceHolder';

export const CanceledOrderCard = ({ provider, order }) => {
  const abiEncoder = new ethers.utils.AbiCoder();

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

  return (
    <li className="px-2 py-4 grid grid-cols-3 gap-2 ">
      {inputToken && outputToken ? (
        <>
          <Tag img={inputToken.imageUrl} symbol={inputToken.symbol} amount={prettyNum(inputAmount, inputToken.decimals)} />
          <Tag img={outputToken.imageUrl} symbol={outputToken.symbol} amount={prettyNum(outputAmount, outputToken.decimals)} />
          <p className="text-sm text-gray-500 text-right">
            <a href={'https://polygonscan.com/tx/' + order.cancelledTxHash} className="underline cursor-pointer hover:text-sky-500">
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
