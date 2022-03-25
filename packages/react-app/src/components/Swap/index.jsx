import React from 'react';
import { RiArrowUpDownLine } from 'react-icons/ri';

export const Swap = () => {
  return (
    <form className="flex flex-col ">
      <h1 className="text-[32px] text-center mt-6 font-bold">SWAP</h1>
      <div className="flex flex-row space-x-2 my-2 ">
        <label>TOKEN ONE: </label>
        <input className="border border-gray-400 rounded flex-grow" />
      </div>
      <button className="rounded-full border border-gray-300 hover:bg-gray-200 w-6 h-6 flex justify-center items-center mx-auto">
        <RiArrowUpDownLine />
      </button>
      <div className="flex flex-row space-x-2 my-2">
        <label>TOKEN TWO: </label>
        <input className="border border-gray-400 rounded flex-grow" />
      </div>

      <button
        className="hover:bg-blue-200 hover:font-bold border border-blue-500 text-blue-500 rounded px-2 py-1 my-2 w-full"
        onClick={() => {}}
      >
        Swap
      </button>
    </form>
  );
};
