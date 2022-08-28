import React, { useState } from 'react';

export const LiquidityInput = ({ inputProps, token, balance, outerClass }) => {
  const [focusState, setFocusState] = useState(false);
  return (
    <div className={`rounded-xl bg-white mx-2 shadow group border-2 w-full ${focusState ? ' border-sky-300' : 'border-transparent'} ${outerClass}`}>
      <div className="flex flex-row items-center whitespace-nowrap px-4 pt-3">
        <input
          className="w-0 text-2xl bg-inherit flex-1 placeholder:text-gray-300 focus:outline-none text-right"
          {...inputProps}
          onFocus={() => setFocusState(true)}
          onBlur={() => setFocusState(false)}
          placeholder="0.0"
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          minLength="1"
          maxLength="79"
          spellCheck="false"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>
      <div className="flex flex-row justify-between py-3 px-4 ">
        <p></p>
        <a className="text-sm text-gray-400 hover:text-gray-500 cursor-pointer">{balance ? 'Balance: ' + balance : '-'}</a>
      </div>
    </div>
  );
};
