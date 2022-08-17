import { abis, addresses } from '@dex/contracts';
import { useContractFunction, useEthers } from '@usedapp/core';
import { BigNumber, FixedNumber } from 'ethers';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { generateSecret, getContract, prettyNum } from '../../common/utils';
import { useSwap } from '../../hooks/useSwap';
import { FiHelpCircle } from 'react-icons/fi';
import { TooltipWrap } from '../Tooltip';
import { CurrencyInput } from '../CurrencyInput';
import { RiCloseLine, RiArrowDownLine } from 'react-icons/ri';
import { ApprovalWrapper, ErrorWrapper, TransactionButton } from '../TransactionButtons';
import { useLimitInputHandler } from '../../hooks/useLimitOrderInputHandle';
import { OrderContainer } from '../Order/OrderContainer';

import { ethers } from 'ethers';
import { Modal } from '../Modal';
import { OrderSummaryModal } from '../Order/OrderSummaryModal';

export const Protocol = () => {
  const { library, account } = useEthers();

  // Contract
  const coreContract = getContract(abis.coreProtocol, addresses[4].coreProtocol, library);
  const { state: placeOrderState, send: submitLimitOrderTx } = useContractFunction(coreContract, 'createOrder', {
    transactionName: 'Successfully place order',
  });

  // Manage all address mapping && liquidity
  const [[address0, address1], setTokenAddresses] = useState([null, null]);
  const [[token0, setAddress0], [token1, setAddress1], [r0, r1], swapError] = useSwap(addresses[4].factory);
  const { price0, price1, tokenInputProps, tokenOutputProps, rateInputProps, currentRate, marketRate, reset } = useLimitInputHandler({
    r0: r0,
    r1: r1,
  });

  // Price
  const [range, setRange] = useState(20);
  const rangeInTokenOutput = useMemo(() => {
    if (price1) {
      if (!range) return BigNumber.from(0);
      const rangeInBN = BigNumber.from(range);
      const ONE_HUNDRED = BigNumber.from(100);
      const maxReturn = price1.mul(rangeInBN.add(ONE_HUNDRED)).div(ONE_HUNDRED);
      return maxReturn;
    }
  }, [range, price1]);
  const marketPriceCompare = useMemo(() => {
    if (currentRate && marketRate && !marketRate?.isZero()) {
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

  // Msc.
  const [rateFocused, setRateFocused] = useState(false);
  const [rangeFocused, setRangeFocused] = useState(false);
  const [confirmPlaceOrder, showConfirmPlaceOrder] = useState(false);
  const abiEncoder = new ethers.utils.AbiCoder();

  useEffect(() => {
    if (swapError) {
      setError(swapError);
    } else if (price0 && price1 && token0 && r1) {
      console.log('log ~ file: index.jsx ~ line 68 ~ useEffect ~ price0', price0);
      if (price0.isZero() || price1.isZero()) setError('Input invalid ');
      else if (price0.gt(token0.balance)) setError("Insufficient user's balance");
      else if (price1.gt(r1)) setError('Insufficient liquidity');
      else setError(null);
    }
  }, [price0, price1, r1, token0, swapError]);

  const handleInputRange = (ev) => {
    const value = ev.target.value?.trim();
    console.log('log ~ file: index.jsx ~ line 85 ~ handleInputRange ~ value', value);
    if (isNaN(+value)) return;
    setRange(value);
  };

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
      showConfirmPlaceOrder(false);
      if (price0 && price1 && rangeInTokenOutput && address0 && address1 && account) {
        const [witnessSecret, witness] = generateSecret();
        const orderParams = [
          addresses[4].entryOrderModule,
          address0,
          account,
          witness,
          price0.toString(),
          abiEncoder.encode(['address', 'uint256', 'uint256'], [address1, price1.toString(), rangeInTokenOutput.toString()]),
          witnessSecret,
        ];

        await submitLimitOrderTx(...orderParams);
      }
    },
    [library, account, price0, price1, address0, address1, rangeInTokenOutput]
  );

  return (
    <div>
      <form className="flex flex-col pt-4">
        <div className="my-2">
          <CurrencyInput
            label="Sell:"
            provider={library}
            account={account}
            tokenAddress={address0}
            onAddressChange={(address) => handleAddressChange(address, true)}
            inputProps={tokenInputProps}
          />

          <span className="w-full flex justify-center items-center h-1">
            <RiArrowDownLine
              className="w-7 h-7 bg-white rounded-[1rem] text-gray-400 border-4 border-sky-100 absolute text-md cursor-pointer hover:bg-sky-100 "
              onClick={reverseInput}
            />
          </span>
          <CurrencyInput
            label="For:"
            provider={library}
            account={account}
            tokenAddress={address1}
            onAddressChange={(address) => handleAddressChange(address, false)}
            inputProps={tokenOutputProps}
          />
          <div className="flex mt-1 mx-2 gap-1">
            <div className={` grow rounded-l-[1.2rem] bg-white shadow group border-2 ${rateFocused ? ' border-sky-300' : 'border-transparent'}`}>
              <div className="flex flex-row justify-between py-3 px-4 ">
                <label className={` text-sm font-semibold ${rateFocused ? ' text-sky-500' : 'text-gray-400'}`}>With price:</label>

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
                {token1 ? <p className="text-xl capitalize tracking-tighter font-semibold px-2 text-gray-400">{token1.symbol}</p> : <></>}
              </div>
            </div>
            <div className={` flex-none w-40 rounded-r-[1.2rem] bg-white shadow group border-2 ${rangeFocused ? ' border-sky-300' : 'border-transparent'}`}>
              <div className="flex flex-row justify-between py-3 px-4 ">
                <label className={` text-sm font-semibold ${rangeFocused ? ' text-sky-500' : 'text-gray-400'}`}>In Range:</label>
                <TooltipWrap
                  tip={
                    <p className="w-96">
                      Your order is filled when <b>current price is in range [order_price, order_price * (1 + X%)]</b>. If it is too low, your order will be
                      difficult to fill
                    </p>
                  }
                >
                  <FiHelpCircle className="inline text-xl cursor-pointer hover:text-sky-500 text-gray-400" />
                </TooltipWrap>
              </div>
              <div className="flex flex-row items-center whitespace-nowrap px-4 pb-3">
                <input
                  className="w-0 text-2xl flex-1 placeholder:text-gray-300 focus:outline-none"
                  onFocus={() => setRangeFocused(true)}
                  onBlur={() => setRangeFocused(false)}
                  placeholder="0.0"
                  type="number"
                  value={range}
                  onChange={handleInputRange}
                />
                <p className="text-xl capitalize tracking-tighter font-semibold px-2 text-gray-400">%</p>
              </div>
            </div>
          </div>
        </div>

        <ErrorWrapper error={error}>
          {token0 && (
            <ApprovalWrapper tokenAddress={address0} target={addresses[4].coreProtocol}>
              <TransactionButton
                className="my-2 mx-2.5 !py-3 !rounded-[1rem]"
                label="Place"
                onClick={() => showConfirmPlaceOrder(true)}
                state={placeOrderState}
              />
            </ApprovalWrapper>
          )}
        </ErrorWrapper>
        <Modal isOpen={confirmPlaceOrder} closeModal={() => showConfirmPlaceOrder(false)} title="Order summary">
          <OrderSummaryModal
            inputAddress={address0}
            outputAddress={address1}
            inputAmount={price0}
            outputAmount={price1}
            provider={library}
            account={account}
            maxOutputAmount={rangeInTokenOutput}
            factoryAddress={addresses[4].factory}
          />
          <button className={`btn-primary px-2 py-2 w-full my-2 `} onClick={placeLimitOrder}>
            Submit order
          </button>
        </Modal>
      </form>
    </div>
  );
};
