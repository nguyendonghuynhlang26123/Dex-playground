import React, { useEffect, useMemo, useState } from 'react';
import TokenIcon from '../../assets/images/token.png';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import { CollapsePanel } from '../CollapsePanel';
import { ethers } from 'ethers';
import { TokenUtils } from '../../common/TokenUtils';
import { prettyNum } from '../../common/utils';

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

  useEffect(() => {
    if (inputAddress) TokenUtils.getTokenInfo(provider, inputAddress).then(setInputToken);
    if (outputAddress) TokenUtils.getTokenInfo(provider, outputAddress).then(setOutputToken);
  }, [inputAddress, outputAddress]);

  return (
    <div className="my-2 p-4 rounded-[1rem] bg-gray-50 border border-gray-300 ">
      {inputToken && outputToken && (
        <div className=" flex flex-row justify-between">
          <div className="flex flex-row items-center gap-2">
            <Tag img={inputToken.imageUrl} symbol={inputToken.symbol} amount={prettyNum(inputAmount)} />
            <HiOutlineArrowNarrowRight />

            <Tag img={outputToken.imageUrl} symbol={outputToken.symbol} amount={prettyNum(outputAmount)} />
          </div>
          <button className="rounded-[1rem] py-1 px-3 text-yellow-800 bg-yellow-100 border border-yellow-300 hover:bg-yellow-300">Cancel</button>
        </div>
      )}
    </div>
  );
};
