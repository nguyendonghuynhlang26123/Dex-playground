import { abis, addresses } from '@dex/contracts';
import { useBlockNumber, useGasPrice, useToken } from '@usedapp/core';
import React, { useEffect, useMemo, useState } from 'react';
import { FiAlertTriangle, FiHelpCircle, FiMinusCircle } from 'react-icons/fi';
import { RiAlertFill } from 'react-icons/ri';
import { UniswapUtils } from '../../common/UniswapUtils';
import { TooltipWrap } from '../Tooltip';
import { BigNumber, ethers, FixedNumber } from 'ethers';
import { compareAddress, getContract } from '../../common/utils';
import { parseEther, parseUnits } from '@ethersproject/units';
import { prettyNum } from '../../common/utils';
import { envConfig } from '../../common/config';
import { useMarketPrice } from '../../hooks/useMarketPrice';
import { useTokenInfo } from '../../hooks/useTokenInfo';
import { ETH_ADDRESS } from '../../common/constants';
import { LoadingPlaceHolder } from '../LoadingPlaceHolder';

const DisplayState = (value = null, error = null, props = null) => ({
  value,
  error,
  ...props,
});

const ValueFieldHolder = ({ value, error, ...props }) => {
  return error ? <p className="text-red-500">{error}</p> : <>{value ? <p {...props}>{value}</p> : <LoadingPlaceHolder />}</>;
};

const identifyOrderType = (inputAddress, outputAddress) => {
  if (compareAddress(inputAddress, addresses[4].weth) || compareAddress(inputAddress, ETH_ADDRESS)) return 'ETH_TO_TOKEN';
  else if (compareAddress(outputAddress, addresses[4].weth) || compareAddress(outputAddress, ETH_ADDRESS)) return 'TOKEN_TO_ETH';
  return 'TOKEN_TO_TOKEN';
};

const prettyTokenDisplay = (amount, token) => {
  if (compareAddress(token.address, addresses[4].weth) || compareAddress(token.address, ETH_ADDRESS)) return `${prettyNum(amount)} ETH`;
  if (amount.gte(ethers.constants.MaxInt256)) return `∞ ${token.symbol}`;
  return `${prettyNum(amount, token.decimals)} ${token.symbol}`;
};

const validateDiffInMinAndMax = (min, max, fee) => {
  if (min.gte(max)) return new DisplayState(null, 'Invalid min & max');
  const diff = max.sub(min);
  if (diff.lte(fee)) return new DisplayState(null, 'Invalid min & max');
  return null;
};

export const OrderSummaryModal = ({ inputAddress, outputAddress, inputAmount, outputAmount, maxOutputAmount, factoryAddress }) => {
  const gasPrice = useGasPrice(); // Update everytime block update => balance is freshly fetched
  const inputToken = useTokenInfo(inputAddress);
  const outputToken = useTokenInfo(outputAddress);
  const [error, setError] = useState();

  // Auto generated fields
  const pairName = useMemo(() => {
    if (inputToken && outputToken) {
      return inputToken.symbol + '/' + outputToken.symbol;
    }
  }, [inputToken, outputToken]);

  // Liquidity values
  const [, convertInputToOutput] = useMarketPrice(addresses[4].factory, inputAddress, outputAddress);
  const [ethToInputRate, convertEthToInputPrice] = useMarketPrice(addresses[4].factory, addresses[4].weth, inputAddress);
  const [ethToOutputRate, convertEthToOutputPrice] = useMarketPrice(addresses[4].factory, addresses[4].weth, outputAddress);
  const orderRate = useMemo(() => {
    if (inputAmount && outputAmount && inputToken && !inputAmount?.isZero()) {
      return UniswapUtils.getPriceRate(inputAmount, outputAmount, inputToken.decimals);
    }
  }, [inputAmount, outputAmount, inputToken]);
  const marketRate = useMemo(() => {
    if (inputAmount && outputAmount && inputToken && !inputAmount?.isZero()) {
      const currentOutput = convertInputToOutput(inputAmount);
      if (currentOutput) return UniswapUtils.getPriceRate(inputAmount, currentOutput, inputToken.decimals);
    }
  }, [inputAmount, inputToken, convertInputToOutput]);
  const estimateGasInEth = useMemo(() => {
    if (gasPrice) {
      return gasPrice.add(envConfig.protocolTips).mul(envConfig.protocolAvgGas);
    }
  }, [gasPrice]);
  const estimateGasInInputToken = useMemo(() => {
    if (estimateGasInEth) {
      return convertEthToInputPrice(estimateGasInEth);
    }
  }, [estimateGasInEth, convertEthToInputPrice.toString()]);
  const estimateGasInOutputToken = useMemo(() => {
    if (estimateGasInEth && convertEthToOutputPrice) {
      return convertEthToOutputPrice(estimateGasInEth);
    }
  }, [estimateGasInEth, ethToInputRate, convertEthToOutputPrice]);

  // Fields to display:
  const inputDisplay = useMemo(() => {
    if (inputToken && inputAmount) {
      return new DisplayState(prettyTokenDisplay(inputAmount, inputToken));
    }
  }, [inputToken, inputAmount]);
  const outputDisplay = useMemo(() => {
    if (outputToken && outputAmount) {
      if (maxOutputAmount && maxOutputAmount.lt(ethers.constants.MaxInt256))
        return new DisplayState(
          (
            <>
              Min: {prettyTokenDisplay(outputAmount, outputToken)}
              <br />
              Max: {prettyTokenDisplay(maxOutputAmount, outputToken)}
            </>
          )
        );
      else return new DisplayState(`> ${prettyTokenDisplay(outputAmount, outputToken)}`);
    }
  }, [outputToken?.toString(), outputAmount, maxOutputAmount]);
  const limitPriceDisplay = useMemo(() => {
    if (orderRate && inputToken && outputToken) {
      const orderRateInBN = BigNumber.from(orderRate);
      return new DisplayState(`${prettyTokenDisplay(orderRateInBN, outputToken)} per ${inputToken.symbol}`);
    }
  }, [orderRate, inputToken, outputToken]);
  const orderTypeDisplay = useMemo(() => {
    if (orderRate && marketRate) {
      const marketRateInBN = BigNumber.from(marketRate.toString());
      const orderRateInBN = BigNumber.from(orderRate.toString());
      if (orderRateInBN.lt(marketRateInBN))
        return new DisplayState(
          (
            <TooltipWrap tip={<p className="w-48">Sell when price is below market</p>}>
              <p className="underline cursor-pointer">Stop order</p>
            </TooltipWrap>
          )
        );
      else
        return new DisplayState(
          (
            <TooltipWrap tip={<p className="w-48">Buy when price is above market</p>}>
              <p className="underline cursor-pointer">Limit order</p>
            </TooltipWrap>
          )
        );
    }
  }, [orderRate, marketRate]);
  const marketPriceDisplay = useMemo(() => {
    if (marketRate && inputToken && outputToken) {
      return new DisplayState(`${prettyTokenDisplay(marketRate, outputToken)} per ${inputToken.symbol}`);
    }
  }, [marketRate, inputToken, outputToken]);
  const currentPriceDisplay = useMemo(() => {
    if (convertInputToOutput && inputToken && outputToken && inputAmount) {
      const currentPrice = convertInputToOutput(inputAmount);
      if (currentPrice) {
        return new DisplayState(`${prettyTokenDisplay(inputAmount, inputToken)} = ${prettyTokenDisplay(currentPrice, outputToken)} `);
      }
    }
  }, [convertInputToOutput, inputToken, outputToken, inputAmount]);
  const marketPriceCompare = useMemo(() => {
    if (orderRate && marketRate && outputToken) {
      const fOneHundred = FixedNumber.from(100);
      const fMarketRate = FixedNumber.from(marketRate.toString());
      const fOrderRate = FixedNumber.from(orderRate.toString());
      const diff = fOrderRate.mulUnsafe(fOneHundred).divUnsafe(fMarketRate).subUnsafe(fOneHundred);
      const displayValue = diff.round(2).toString();
      return new DisplayState(`${diff.isNegative() ? '' : '+'}${displayValue}%`, null, {
        className: diff.isZero() ? '' : diff.isNegative() ? 'text-red-500' : 'text-green-500',
      });
    }
  }, [orderRate, marketRate, outputToken]);

  const estimateGasDisplay = useMemo(() => {
    if (estimateGasInEth) {
      if (inputToken && outputToken) {
        const type = identifyOrderType(inputToken.address, outputToken.address);
        const estimateCost = type === 'TOKEN_TO_TOKEN' ? estimateGasInInputToken : estimateGasInOutputToken;
        const estimateSymbol = type === 'TOKEN_TO_TOKEN' ? outputToken.symbol : inputToken.symbol;
        if (type === 'TOKEN_TO_TOKEN' && estimateCost) {
          return new DisplayState(
            (
              <>
                {prettyNum(estimateGasInEth)} ETH
                <br /> ({prettyNum(estimateCost)} {estimateSymbol})
              </>
            )
          );
        }
      }
      return new DisplayState(`${prettyNum(estimateGasInEth)} ETH `);
    }
  }, [estimateGasInEth, inputToken, outputToken, estimateGasInInputToken, estimateGasInOutputToken]);

  const realExecutionCostDisplay = useMemo(() => {
    if (inputToken && outputToken && estimateGasInEth && inputAmount && outputAmount && maxOutputAmount) {
      if (outputAmount.gte(maxOutputAmount)) return new DisplayState(null, 'Invalid min & max output');
      const type = identifyOrderType(inputToken.address, outputToken.address);
      if (type === 'ETH_TO_TOKEN') {
        if (estimateGasInEth.gte(inputAmount)) return new DisplayState(null, 'Order is too small to pay fee');
        const realInput = inputAmount.sub(estimateGasInEth);
        return new DisplayState(
          `${prettyTokenDisplay(outputAmount, outputToken)} < ${prettyNum(realInput)} ETH < ${prettyTokenDisplay(maxOutputAmount, outputToken)}`
        );
      } else if (type === 'TOKEN_TO_ETH') {
        if (estimateGasInEth.gte(outputAmount)) return new DisplayState(null, 'User will receive less than paying for execution cost!');
        const realOutputMin = estimateGasInEth.add(outputAmount);
        const realOutputMax = estimateGasInEth.add(maxOutputAmount);
        return new DisplayState(`${prettyNum(realOutputMin)} ETH  < ${prettyTokenDisplay(inputAmount, inputToken)} < ${prettyNum(realOutputMax)} ETH `);
      } else {
        let displayText = '';
        if (estimateGasInInputToken && estimateGasInOutputToken) {
          if (estimateGasInInputToken.gte(inputAmount)) return new DisplayState(null, 'Order too small! Insufficient to pay for execution cost');
          if (estimateGasInOutputToken.gte(outputAmount)) return new DisplayState(null, 'User will receive less than paying for execution cost!');

          const realOutputMin = estimateGasInOutputToken.add(outputAmount);
          displayText += `${prettyTokenDisplay(realOutputMin, outputToken)} < ${prettyTokenDisplay(inputAmount, inputToken)} `;
          const realOutputMax = estimateGasInOutputToken.add(maxOutputAmount);
          displayText += `< ${prettyTokenDisplay(realOutputMax, outputToken)}`;
        }
        return new DisplayState(displayText);
      }
    }
  }, [inputToken, outputToken, estimateGasInEth, estimateGasInInputToken, estimateGasInOutputToken, inputAmount, outputAmount, maxOutputAmount]);

  return (
    <div className="rounded-lg border border-yellow-500 bg-yellow-50 mt-4 w-[50rem] text-gray-600">
      <ul className="py-3 px-6 text-sm gap-1 list-disc list-inside leading-6 text-yellow-600">
        <li>Order with small input amount will not be able to cover fee.</li>

        <li>Small range may also make order difficult to be filled.</li>

        <li>The order will be executed when the market price reaches high enough above your order price range (to also pay gas fee for your transaction!)</li>

        <li>Filling order involves transferring token multiple time. Trading Tokens with fee on transfer is not recommended!</li>
      </ul>

      <div className="flex flex-wrap border-t border-yellow-500 divide-x divide-yellow-500 ">
        <div className="p-3 basis-1/2">
          <span className="rounded-lg border border-green-500 bg-green-100 text-green-500 px-3">Order summary</span>
          <div className="flex justify-between py-2">
            <p>DEX: </p>
            <p className="text-green-600">Uniswap V2</p>
          </div>

          <div className="flex justify-between py-2 gap-2">
            <p>Order type: </p>
            <ValueFieldHolder {...orderTypeDisplay} className="text-green-600" />
          </div>

          <div className="flex justify-between py-2 gap-2">
            <p>Amount deposited: </p>
            <ValueFieldHolder {...inputDisplay} className="text-green-600" />
          </div>

          <div className="flex justify-between py-2 gap-2">
            <p>Expect to receive: </p>
            <ValueFieldHolder {...outputDisplay} className="text-green-600" />
          </div>

          <div className="flex justify-between py-2 gap-2">
            <p>Order rate: </p>
            <ValueFieldHolder {...limitPriceDisplay} className="text-green-600" />
          </div>
        </div>
        <div className="p-3 basis-1/2">
          <span className="rounded border border-cyan-500 bg-cyan-100 text-cyan-500 px-3">Current summary</span>
          <div className="flex justify-between py-2 gap-2">
            <p>Market rate: </p>
            <ValueFieldHolder {...marketPriceDisplay} />
          </div>
          <div className="flex justify-between py-2 gap-2">
            <p>Current price: </p>
            <ValueFieldHolder {...currentPriceDisplay} />
          </div>
          <div className="flex justify-between py-2 gap-2">
            <p>Required {pairName ?? ''} to change: </p>
            <span className="flex items-center text-yellow-600">
              <TooltipWrap tip={<p className="w-80">It might take longer than expected to reach the price that fill your orders+fee</p>}>
                <RiAlertFill className="inline text-xl cursor-pointer hover:text-yellow-700" />
              </TooltipWrap>
              <ValueFieldHolder {...marketPriceCompare} />
            </span>
          </div>

          <div className="flex justify-between py-2 gap-2">
            <span>Estimate cost</span>

            <span className="text-yellow-600 flex items-center gap-2">
              <TooltipWrap
                tip={
                  <p className="w-96">
                    <b>Gas price is volatile</b>; thus the exact market price at which your order execute is unpredictable. What display here is the fee
                    calculating base on gas price at the moment
                  </p>
                }
              >
                <RiAlertFill className="inline text-xl cursor-pointer hover:text-yellow-700" />
              </TooltipWrap>

              <ValueFieldHolder {...estimateGasDisplay} className="text-yellow-600 text-right" />
            </span>
          </div>
        </div>
      </div>

      <div className="flex p-3 border-t border-yellow-500 justify-between">
        <span className="inline-flex items-center gap-2">
          Order will be executed when:
          <TooltipWrap tip={<p className="w-64 text-sm">real execution price = (your-limit-price) + (execution-cost)</p>}>
            <FiHelpCircle className="inline text-xl cursor-pointer hover:text-sky-700" />
          </TooltipWrap>
        </span>
        <ValueFieldHolder {...realExecutionCostDisplay} className="text-gray-600 text-right" />
      </div>
    </div>
  );
};
