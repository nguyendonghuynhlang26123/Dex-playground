import { addresses } from '@dex/contracts';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TokenUtils } from '../../common/TokenUtils';
import { Modal } from '../Modal';
import TokenIcon from '../../assets/images/token.png';
import { prettyNum } from '../../common/utils';
import { BiChevronDown } from 'react-icons/bi';
import { useBlockNumber, useDebounce } from '@usedapp/core';
import { LoadingPlaceHolder } from '../LoadingPlaceHolder';
import { ethers } from 'ethers';
import { TokenImage } from '../TokenImage';

const supportsTokens = [
  {
    symbol: 'WETH',
    imageUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    address: addresses[4].weth,
  },
  {
    symbol: 'ONE',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Eo_circle_red_number-1.svg/1200px-Eo_circle_red_number-1.svg.png',
    address: addresses[4].one,
  },
  {
    symbol: 'TWO',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Eo_circle_blue_number-2.svg/1200px-Eo_circle_blue_number-2.svg.png',
    address: addresses[4].two,
  },
];

export const CurrencyInput = ({ provider, account, label, tokenAddress, onAddressChange, inputProps }) => {
  const blockNumber = useBlockNumber(); // Update everytime block update => balance is freshly fetched

  const [token, setTokenInfo] = useState(null);
  const [focusState, setFocusState] = useState(false);
  const [selectModal, showModal] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const debounceInput = useDebounce(customInput, 500);
  const [loadingToken, setLoading] = useState(false);
  const [loadingSelectedToken, setLoadingSelectedToken] = useState(false);
  const [error, setError] = useState(null);
  const [customToken, setCustomToken] = useState(null);

  useEffect(() => {
    (async () => {
      if (provider && account) {
        if (tokenAddress) {
          const info = await TokenUtils.getTokenInfo(provider, tokenAddress, account);
          setTokenInfo(info);
        } else setTokenInfo(null);
      }
    })();
  }, [tokenAddress, provider, account, blockNumber]);

  useEffect(() => {
    let cleanUp = false;
    const loadingCustomInput = async () => {
      setLoading(true);
      if (debounceInput !== '') {
        if (!ethers.utils.isAddress(debounceInput) && !cleanUp) {
          setLoading(false);
          setError('Input must be an address');
          setCustomToken(null);
        } else if (!(await TokenUtils.isERC20Token(provider, debounceInput)) && !cleanUp) {
          setLoading(false);
          setError('Please input ERC20 token contract only');
          setCustomToken(null);
        } else {
          const tokenInfo = await TokenUtils.getTokenInfo(provider, debounceInput);
          console.log('log ~ file: index.jsx ~ line 69 ~ loadingCustomInput ~ tokenInfo', tokenInfo);
          if (cleanUp) return;
          setLoading(false);
          setError(null);
          setCustomToken(tokenInfo);
        }

        return;
      }
      setLoading(false);
      setCustomToken(null);
    };

    loadingCustomInput();
    return () => (cleanUp = true);
  }, [debounceInput]);

  const onTokenSelect = (selectToken) => {
    if (onAddressChange && selectToken.address !== tokenAddress) onAddressChange(selectToken.address);
    showModal(false);
  };

  return (
    <>
      <div className={`rounded-3xl bg-white mx-2 shadow group border-2 ${focusState ? ' border-sky-300' : 'border-transparent'}`}>
        <div className="flex flex-row justify-between py-3 px-4 ">
          <label className={`text-sm font-semibold tracking-wide ${focusState ? ' text-sky-500' : 'text-gray-400'}`}>{label}</label>
          <a className="text-sm text-gray-400 hover:text-gray-500 cursor-pointer">{token ? 'Balance: ' + prettyNum(token.balance) : '-'}</a>
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
          <button
            className=" flex flex-row items-center rounded-full py-1 px-3 bg-sky-50 border border-gray-200 hover:bg-gray-100"
            onClick={(ev) => {
              ev.preventDefault();
              showModal(true);
            }}
          >
            {token ? (
              <>
                <img
                  src={token.imageUrl}
                  className="w-6 h-6 mr-2 bg-white rounded-full"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src = TokenIcon;
                  }}
                />
                <span>{token.symbol}</span>
                <BiChevronDown />
              </>
            ) : (
              <>
                <span>Select token</span>
                <BiChevronDown />
              </>
            )}
          </button>
        </div>
      </div>

      <Modal isOpen={selectModal} closeModal={() => showModal(false)} title="Select token">
        <div className="mt-4">
          <p className="text-sm text-gray-500">Supporting token: </p>
        </div>

        <div className="mt-2 flex flex-row flex-wrap gap-2">
          {supportsTokens.map((token, i) => (
            <button
              type="button"
              className="flex flex-row items-center rounded-lg py-1 px-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 cursor-pointer"
              key={i}
              onClick={() => {
                onTokenSelect(token);
              }}
            >
              <img src={token.imageUrl} className="w-5 h-5 mr-1" />
              <span>{token.symbol}</span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500">Custom token: </p>
        </div>
        <input
          className={`flex px-4 py-2 my-2 rounded-lg ${error ? 'border border-red-500' : ''}`}
          placeholder="Input token address"
          value={customInput}
          onChange={(ev) => setCustomInput(ev.target.value)}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="mt-3 flex flex-row flex-wrap gap-2 ">
          {loadingToken ? (
            <LoadingPlaceHolder className="mx-auto col-span-4" />
          ) : customToken ? (
            <button
              className="flex flex-row items-center rounded-lg py-4 px-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 cursor-pointer w-full"
              onClick={() => onTokenSelect(customToken)}
            >
              <TokenImage image={customToken.imageUrl} className="w-6 h-6 mr-2" />
              <span className="">{customToken.name}</span>
              <span className="text-gray-600 mx-2 text-sm">{customToken.symbol}</span>
            </button>
          ) : (
            customInput !== '' && <p className="text-gray-500 text-center text-sm">No result found</p>
          )}
        </div>
      </Modal>
    </>
  );
};
