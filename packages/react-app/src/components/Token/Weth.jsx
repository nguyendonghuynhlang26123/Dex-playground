import { useEthers, useToken, useTokenBalance, useContractFunction, useEtherBalance } from '@usedapp/core';
import React, { useEffect, useState } from 'react';
import { parseInput, getContract, prettyNum } from '../../common/utils';
import { abis, addresses } from '@dex/contracts';
import { TransactionButton } from '../TransactionButtons';

export const Weth = ({ address }) => {
  const { account } = useEthers();
  const weth = useToken(address);
  const ethBalance = useEtherBalance(account);
  const wethBalance = useTokenBalance(address, account);
  const wethContract = getContract(abis.weth, address);
  const { state, send } = useContractFunction(wethContract, 'deposit', { transactionName: 'Weth Deposited' });
  const [userInput, setInput] = useState(0);

  const onInput = (ev) => {
    const value = ev.target.value;
    if (!isNaN(value)) setInput(value);
  };

  const depositEth = (input) => {
    if (input && !isNaN(input)) {
      const actualInput = parseInput(input, 18);
      send({
        value: actualInput,
      });
    } else {
      alert('Invalid input');
    }
  };

  return weth ? (
    <div className="flex flex-col my-2">
      <h1 className="text-[32px] text-center mt-4 mb-2 font-bold">WMatic</h1>
      <p>
        <b>Token name</b>: {weth?.name}
      </p>
      <p>
        <b>Token symbol</b>: {weth?.symbol}
      </p>
      <p>
        <b>Token decimals</b>: {weth?.decimals}
      </p>
      <p>
        <b>Token totalSupply</b>: {weth?.totalSupply ? prettyNum(weth?.totalSupply, weth?.decimals) : ''}
      </p>
      <hr className="w-32 mx-auto my-2 border-gray-500" />
      <p>
        Your balance: {wethBalance ? prettyNum(wethBalance, weth?.decimals) : ''} WMatic / {ethBalance ? prettyNum(ethBalance) : ''} Matic
      </p>
      <div className="flex flex-row w-full space-x-2 items-center">
        <p>Deposit ETH</p>
        <input className="flex-grow border border-gray-300 rounded px-2 py-1 my-0.5" type="number" value={userInput} onChange={onInput} />
        <TransactionButton
          onClick={() => {
            depositEth(userInput);
          }}
          className="w-24"
          state={state}
          label="Deposit"
        />
      </div>
    </div>
  ) : (
    <>Loading...</>
  );
};
