import React from 'react';
import TokenIcon from '../../assets/images/token.png';

export const Tag = ({ amount, img, symbol }) => {
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
