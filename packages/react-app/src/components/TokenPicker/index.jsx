import { addresses } from '@dex/contracts';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TokenUtils } from '../../common/TokenUtils';
import { Modal } from '../Modal';
import TokenIcon from '../../assets/images/token.png';
import { BiChevronDown } from 'react-icons/bi';
import { useBlockNumber, useDebounce } from '@usedapp/core';
import { LoadingPlaceHolder } from '../LoadingPlaceHolder';
import { ethers } from 'ethers';
import { TokenImage } from '../TokenImage';
import { tokens } from '../../common/supportTokens.json';

const fallbackCommonTokens = [
  {
    'name': 'Wrapped Matic',
    'address': '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    'symbol': 'WMATIC',
    'decimals': 18,
    'chainId': 137,
    'imageUrl': 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0/logo.png',
  },
  {
    'name': 'Token ONE',
    'address': '0x03014bD6A40D06908C5301A7015DFFC25FAeeF05',
    'symbol': 'ONE',
    'chainId': 137,
    'imageUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Eo_circle_red_number-1.svg/1200px-Eo_circle_red_number-1.svg.png',
    'decimals': 18,
  },
  {
    'name': 'Token TWO',
    'address': '0x4d93C0a2353F2776b8Dd83b8fA9Eb624e5B1E2E3',
    'symbol': 'TWO',
    'chainId': 137,
    'imageUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Eo_circle_blue_number-2.svg/1200px-Eo_circle_blue_number-2.svg.png',
    'decimals': 18,
  },
  // {
  //   'name': 'Token THREE',
  //   'address': '0xcb0Cde022fbA31bD37c6B3BfC9F07550750f40Fe',
  //   'symbol': 'THREE',
  //   'chainId': 137,
  //   'imageUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Icon_3_green.svg/1200px-Icon_3_green.svg.png',
  //   'decimals': 9,
  // },
  // {
  //   'name': 'Token FOUR',
  //   'address': '0x0373455AE8510853C9Ea66638b00093663c17B14',
  //   'symbol': 'FOUR',
  //   'chainId': 137,
  //   'imageUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Icon_4_yellow.svg/512px-Icon_4_yellow.svg.png',
  //   'decimals': 4,
  // },
];

export const TokenPickerButton = ({ provider, account, tokenAddress, onTokenSelect, commonTokens = fallbackCommonTokens, tokenLists = tokens, ...props }) => {
  const blockNumber = useBlockNumber(); // Update everytime block update => balance is freshly fetched

  const [token, setTokenInfo] = useState(null);
  const [selectModal, showModal] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const debounceInput = useDebounce(customInput, 500);
  const [loadingToken, setLoading] = useState(false);
  const [loadingSelectedToken, setLoadingSelectedToken] = useState(false);
  const [error, setError] = useState(null);
  const [displayTokens, setDisplayingTokens] = useState(tokenLists);

  useEffect(() => {
    (async () => {
      if (provider && account) {
        setLoadingSelectedToken(true);
        if (tokenAddress) {
          const info = await TokenUtils.getTokenInfo(provider, tokenAddress, account);
          setTokenInfo(info);
        } else setTokenInfo(null);
        setLoadingSelectedToken(false);
      }
    })();
  }, [tokenAddress, provider, account, blockNumber]);

  useEffect(() => {
    let cleanUp = false;
    const onUserInputDebounced = async () => {
      setLoading(true);
      if (debounceInput !== '') {
        let error = null;
        let resultTokens = null;

        if (!ethers.utils.isAddress(debounceInput)) {
          // If input is not an address, search in the tokenLists for name and symbol
          resultTokens = tokenLists.filter((t) => {
            return t.symbol.toLowerCase().includes(debounceInput.toLowerCase()) || t.name.toLowerCase().includes(debounceInput.toLowerCase());
          });
        } else {
          resultTokens = [await TokenUtils.getTokenInfo(provider, debounceInput)];
        }

        if (cleanUp) return;
        setDisplayingTokens(resultTokens);
        setLoading(false);
        setError(error);
      } else {
        setLoading(false);
        setDisplayingTokens(tokenLists);
      }
    };

    onUserInputDebounced();
    return () => (cleanUp = true);
  }, [debounceInput]);

  const handleTokenSelect = (selectToken) => {
    if (onTokenSelect && selectToken.address !== tokenAddress) onTokenSelect(selectToken);
    showModal(false);
  };

  return (
    <>
      <button
        className=" flex flex-row items-center rounded-full py-2 px-4 bg-sky-50 border border-gray-200 hover:bg-gray-100"
        onClick={(ev) => {
          ev.preventDefault();
          showModal(true);
        }}
        {...props}
      >
        {token ? (
          <>
            <div className="flex flex-row">
              <img
                src={token.imageUrl}
                className="w-6 h-6 mr-2 bg-white rounded-full"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null; // prevents looping
                  currentTarget.src = TokenIcon;
                }}
              />
              <span>{token.symbol}</span>
            </div>
            <BiChevronDown />
          </>
        ) : loadingSelectedToken ? (
          <div className="flex flex-row items-center gap-2">
            <span>Loading</span>
            <LoadingPlaceHolder className="mx-auto col-span-4" />
          </div>
        ) : (
          <>
            <span>Select token</span>
            <BiChevronDown />
          </>
        )}
      </button>

      <Modal isOpen={selectModal} closeModal={() => showModal(false)} title="Select token">
        <div className="w-[450px]">
          <input
            className={`w-full flex px-4 py-2 my-2 mt-4 rounded-lg ${error ? 'border border-red-500' : ''}`}
            placeholder="Input token address"
            value={customInput}
            onChange={(ev) => setCustomInput(ev.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="mt-4">
            <p className="text-sm text-gray-500">Common tokens: </p>
          </div>

          <div className="mt-2 flex flex-row flex-wrap gap-2">
            {commonTokens.map((token, i) => (
              <button
                type="button"
                className="flex flex-row items-center rounded-xl py-2 px-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 cursor-pointer"
                key={i}
                onClick={() => {
                  handleTokenSelect(token);
                }}
              >
                <img src={token.imageUrl} className="w-6 h-6 mr-2" />
                <span>{token.symbol}</span>
              </button>
            ))}
          </div>
          <hr className="mt-2" />
          <div className="mt-3 max-h-48 overflow-y-auto ">
            {loadingToken ? (
              <LoadingPlaceHolder className="mx-auto col-span-4" />
            ) : displayTokens ? (
              <ul className="flex flex-col gap-1">
                {displayTokens.map((token, i) => (
                  <button
                    key={i}
                    className="flex flex-row items-center rounded-lg py-4 px-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 cursor-pointer w-full"
                    onClick={() => handleTokenSelect(token)}
                  >
                    <TokenImage image={token.imageUrl} className="w-6 h-6 mr-2" />
                    <span className="">{token.name}</span>
                    <span className="text-gray-600 mx-2 text-sm">{token.symbol}</span>
                  </button>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center text-sm">No result found</p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
