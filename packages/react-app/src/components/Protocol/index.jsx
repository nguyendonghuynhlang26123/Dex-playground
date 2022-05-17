import { abis, addresses } from '@dex/contracts';
import { useContractFunction, useEthers } from '@usedapp/core';
import { BigNumber, FixedNumber } from 'ethers';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { UniswapUtils } from '../../common/UniswapUtils';
import { generateSecret, getContract, prettyNum } from '../../common/utils';
import { useSwap } from '../../hooks/useSwap';

import { CurrencyInput } from '../CurrencyInput';
import { RiCloseLine, RiArrowDownLine } from 'react-icons/ri';
import { ApprovalWrapper, ErrorWrapper, TransactionButton } from '../TransactionButtons';
import { useLimitInputHandler } from '../../hooks/useLimitOrderInputHandle';
import { OrderContainer } from '../Order/OrderContainer';
//import { AbiCoder } from '@ethersproject/abi';
import { ethers } from 'ethers';

export const Protocol = () => {
  const { library, account } = useEthers();

  // Contract
  const coreContract = getContract(abis.coreProtocol, addresses[4].coreProtocol, library);
  const { state: placeOrderState, send: submitLimitOrderTx } = useContractFunction(coreContract, 'createOrder', {
    transactionName: 'Successfully place limit order',
  });

  // Manage all address mapping && liquidity
  const [[address0, address1], setTokenAddresses] = useState([null, null]);
  const [[token0, setAddress0], [token1, setAddress1], [r0, r1], swapError] = useSwap(addresses[4].factory);
  const { price0, price1, tokenInputProps, tokenOutputProps, rateInputProps, currentRate, marketRate, reset } = useLimitInputHandler({
    r0: r0,
    r1: r1,
  });

  // Price
  const marketPriceCompare = useMemo(() => {
    if (currentRate && marketRate) {
      const fOneHundred = FixedNumber.from(100);
      const diff = currentRate.mulUnsafe(fOneHundred).divUnsafe(marketRate).subUnsafe(fOneHundred);
      const displayValue = diff.round(2).toString();
      return {
        value: displayValue,
        message: `${displayValue}% ${diff.isNegative() ? 'below' : 'above'} market`,
        style: diff.isZero() ? '' : diff.isNegative() ? 'text-red-500' : 'text-green-500',
      };
    }
  }, [currentRate, marketRate]);

  // Pool state management
  const [error, setError] = useState('Enter amount');
  const slippage = useSelector((state) => state.slippage.value);
  const { value: deadline, toSec } = useSelector((state) => state.deadline);

  // Msc.
  const [rateFocused, setRateFocused] = useState(false);
  const abiEncoder = new ethers.utils.AbiCoder();

  useEffect(() => {
    if (swapError) {
      setError(swapError);
    } else if (price0 && price1 && token0 && r1) {
      if (price0.isZero() || price1.isZero()) setError('Input invalid ');
      else if (price0.gt(token0.balance)) setError("Insufficient user's balance");
      else if (price1.gt(r1)) setError('Insufficient liquidity');
      else setError(null);
    }
  }, [price0, price1, r1, token0, swapError]);

  const reverseInput = useCallback(() => {
    setAddress0(address1);
    setAddress1(address0);
    setTokenAddresses((prv) => [prv[1], prv[0]]);
  }, [address0, address1]);

  const handleAddressChange = useCallback(
    (address, isInput) => {
      if (isInput) {
        setAddress0(address);

        if (address === address1) {
          setAddress1(null);
          setTokenAddresses((prv) => [address, null]);
        } else setTokenAddresses((prv) => [address, prv[1]]);
      } else {
        setAddress1(address);
        if (address === address0) {
          setAddress0(null);
          setTokenAddresses([null, address]);
        } else setTokenAddresses((prv) => [prv[0], address]);
      }
    },
    [address0, address1]
  );

  const placeLimitOrder = useCallback(
    async (ev) => {
      ev.preventDefault();
      if (price0 && price1 && address0 && address1 && account) {
        const [witnessSecret, witness] = generateSecret();
        const orderParams = [
          addresses[4].limitOrderModule,
          address0,
          account,
          witness,
          price0.toString(),
          abiEncoder.encode(['address', 'uint256'], [address1, price1.toString()]),
          witnessSecret,
        ];

        await submitLimitOrderTx(...orderParams);
      }
    },
    [library, account, price0, price1, address0, address1]
  );

  return (
    <div>
      <form className="flex flex-col bg-gray-100 px-2 py-4">
        <h1 className="text-[32px] text-center mt-6 mb-2 font-bold">Limit Order</h1>
        <div className="my-2">
          <CurrencyInput
            label="Input"
            provider={library}
            account={account}
            tokenAddress={address0}
            onAddressChange={(address) => handleAddressChange(address, true)}
            inputProps={tokenInputProps}
          />
          <span className="w-full flex justify-center items-center h-1">
            <RiCloseLine
              className="w-7 h-7 p-0.5 bg-white rounded-[1rem] text-gray-400 border-4 border-gray-100 absolute text-md cursor-pointer hover:bg-gray-100"
              onClick={reverseInput}
            />
          </span>
          <div className={`rounded-[1.2rem] bg-white mx-2 shadow group border ${rateFocused ? ' border-blue-500' : 'border-transparent'}`}>
            <div className="flex flex-row justify-between py-3 px-4 ">
              <label className="text-sm text-gray-400">Price</label>

              <a className="text-sm text text-gray-400 hover:text-gray-500 cursor-pointer">
                {marketPriceCompare ? <span className={marketPriceCompare.style}>{marketPriceCompare.message}</span> : ''}
              </a>
            </div>
            <div className="flex flex-row items-center whitespace-nowrap px-4 pb-3">
              <input
                className="w-0 text-2xl flex-1 placeholder:text-gray-300 focus:outline-none"
                onFocus={() => setRateFocused(true)}
                onBlur={() => setRateFocused(false)}
                placeholder="0.0"
                {...rateInputProps}
              />
            </div>
          </div>
          <span className="w-full flex justify-center items-center h-1">
            <RiArrowDownLine
              className="w-7 h-7 p-0.5 bg-white rounded-full text-gray-400 border-4 border-gray-100 absolute text-md cursor-pointer hover:bg-gray-100"
              onClick={reverseInput}
            />
          </span>
          <CurrencyInput
            label="Output"
            provider={library}
            account={account}
            tokenAddress={address1}
            onAddressChange={(address) => handleAddressChange(address, false)}
            inputProps={tokenOutputProps}
          />
        </div>

        <ErrorWrapper error={error}>
          {token0 && (
            <ApprovalWrapper tokenAddress={address0} target={addresses[4].coreProtocol}>
              <TransactionButton className="my-2 mx-2.5 !py-3 !rounded-[1rem]" label="Place" onClick={placeLimitOrder} state={placeOrderState} />
            </ApprovalWrapper>
          )}
        </ErrorWrapper>
      </form>

      <div className="mt-8">
        <h1 className="text-2xl">Open orders</h1>
        <hr className="mb-4" />
        <OrderContainer />
      </div>
    </div>
  );
};
