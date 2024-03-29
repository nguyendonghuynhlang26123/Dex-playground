import React, { useEffect, useState } from 'react';
import { useBlockNumber, useEthers } from '@usedapp/core';
import { TokenUtils } from '../common/TokenUtils';
import { getContract } from '../common/utils';
import { abis } from '@dex/contracts';
import { BigNumber } from 'ethers';

export const useSwap = (factoryAddress) => {
  const { library: provider, account } = useEthers();

  const [address0, setAddress0] = useState();
  const [address1, setAddress1] = useState();

  const [token0, setToken0] = useState();
  const [token1, setToken1] = useState();

  // Liquidity tracker
  const [pairAddress, setPairAddress] = useState();
  const [isTokenReversed, setIsTokenReverse] = useState();
  const [[r0, r1], setReserves] = useState([null, null]);

  // Utils
  const factoryContract = getContract(abis.factory, factoryAddress, provider);
  const [error, setError] = useState();

  const resetState = () => {
    setPairAddress(null);
    setIsTokenReverse(null);
    setReserves([null, null]);
  };

  useEffect(() => {
    let cleanUp = false;
    if (address0) {
      setError(null);
      TokenUtils.getTokenInfo(provider, address0, account)
        .then((tokenInfo) => {
          if (!cleanUp) setToken0(tokenInfo);
        })
        .catch((err) => {
          setError('Failed to fetch token address0');
        });
    } else resetState();

    return () => (cleanUp = true);
  }, [address0]);

  useEffect(() => {
    let cleanUp = false;
    if (address1) {
      setError(null);
      TokenUtils.getTokenInfo(provider, address1, account)
        .then((tokenInfo) => {
          if (!cleanUp) setToken1(tokenInfo);
        })
        .catch((err) => {
          setError('Failed to fetch token address1');
        });
    } else resetState();

    return () => (cleanUp = true);
  }, [address1]);

  useEffect(() => {
    let cleanUp = false;
    const fetchPairAddress = async () => {
      if (address0 && address1 && address0 != address1) {
        const pairAddress = await factoryContract.getPair(address0, address1);
        if (cleanUp) return;

        if (pairAddress !== '0x0000000000000000000000000000000000000000') {
          setPairAddress(pairAddress);
          setIsTokenReverse(BigNumber.from(address0).gt(BigNumber.from(address1)));
        } else {
          setError('Not found liquidity pool for this pair of token');
          resetState();
        }
      }
    };

    setError(null);
    fetchPairAddress();
    return () => (cleanUp = true);
  }, [address0, address1]);

  useEffect(() => {
    let cleanUp = false;
    const fetchReserves = async () => {
      if (pairAddress && isTokenReversed !== null) {
        const pairContract = getContract(abis.pair, pairAddress, provider);
        const [_r0, _r1, timestamp] = await pairContract.getReserves();
        if (cleanUp) return;
        if (_r0 === null || _r1 === null || _r0.isZero() || _r1.isZero()) setError('Not enough liquidity for this pair of token');
        else if (isTokenReversed) setReserves([_r1, _r0]);
        else setReserves([_r0, _r1]);
      }
    };

    setError(null);
    fetchReserves();
    return () => (cleanUp = true);
  }, [pairAddress, isTokenReversed, provider]); // Should fetch fresh data

  return [[token0, setAddress0], [token1, setAddress1], [r0, r1], error];
};
