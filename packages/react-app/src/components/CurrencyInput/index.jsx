import React, { useEffect, useState } from 'react';
import { TokenUtils } from '../../common/TokenUtils';
import { prettyNum } from '../../common/utils';

import { TokenPickerButton } from '../TokenPicker';

export const CurrencyInput = ({ provider, account, label, tokenAddress, onAddressChange, inputProps, tokenLists }) => {
  const [token, setTokenInfo] = useState(null);
  const [displayingTokenBalance, setTokenBalance] = useState(null);
  const [focusState, setFocusState] = useState(false);

  const handleTokenSelect = (token) => {
    if (token?.address !== null && token.address !== tokenAddress) {
      setTokenInfo(token);
      onAddressChange(token.address);
    }
  };

  useEffect(() => {
    let cleanUp = false;
    const fetchTokenBalance = async () => {
      if (tokenAddress && account && provider) {
        const tokenInfo = await TokenUtils.getTokenInfo(provider, tokenAddress, account);

        // if (!cleanUp) setTokenBalance(prettyNum(userBalance, token.decimals));
        if (!cleanUp) setTokenBalance(tokenInfo.readable);
      }
    };

    fetchTokenBalance();
    return () => (cleanUp = true);
  }, [account, provider, tokenAddress]);

  return (
    <div className={`rounded-3xl bg-white mx-2 shadow group border-2 ${focusState ? ' border-sky-300' : 'border-transparent'}`}>
      <div className="flex flex-row justify-between py-3 px-4 ">
        <label className={`text-sm font-semibold tracking-wide ${focusState ? ' text-sky-500' : 'text-gray-400'}`}>{label}</label>
        <a className="text-sm text-gray-400 hover:text-gray-500 cursor-pointer">{displayingTokenBalance ? 'Balance: ' + displayingTokenBalance : '-'}</a>
      </div>
      <div className="flex flex-row items-center whitespace-nowrap px-4 pb-3">
        <input
          className="w-0 text-2xl bg-inherit flex-1 placeholder:text-gray-300 focus:outline-none"
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

        <TokenPickerButton provider={provider} account={account} tokenAddress={tokenAddress} onTokenSelect={handleTokenSelect} tokenLists={tokenLists} />
      </div>
    </div>
  );
};
