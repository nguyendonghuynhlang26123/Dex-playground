import { useQuery } from '@apollo/client';
import { useToken } from '@usedapp/core';
import React, { useState } from 'react';
import { RiArrowUpDownLine } from 'react-icons/ri';

export const Swap = ({ token1Address, token2Address, swapPosition }) => {
  const token1 = useToken(token1Address);
  const token2 = useToken(token2Address);

  return token1 && token2 ? (
    <form className="flex flex-col ">
      <h1 className="text-[32px] text-center mt-6 mb-2 font-bold">SWAP</h1>

      <div className="flex flex-row space-x-2 my-2 ">
        <label className="w-24">{token1.symbol}: </label>
        <input className="border border-gray-400 rounded flex-grow" />
      </div>
      <button
        className="rounded-full border border-gray-300 hover:bg-gray-200 w-6 h-6 flex justify-center items-center mx-auto"
        onClick={swapPosition}
      >
        <RiArrowUpDownLine />
      </button>
      <div className="flex flex-row space-x-2 my-2 ">
        <label className="w-24">{token2.symbol}: </label>
        <input className="border border-gray-400 rounded flex-grow" />
      </div>
      <p className="text-gray-600 text-center">1 ETH = 20</p>
      <button
        className="hover:bg-blue-200 hover:font-bold border border-blue-500 text-blue-500 rounded px-2 py-1 my-2 w-full"
        onClick={() => {}}
      >
        Swap
      </button>
    </form>
  ) : (
    <p>Loading...</p>
  );
};
