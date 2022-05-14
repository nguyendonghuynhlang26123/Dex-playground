import { useEthers, useToken, useTokenBalance, useContractFunction } from '@usedapp/core';
import React, { useEffect, useState } from 'react';
import { _18Digits, getContract, prettyNum } from '../../common/utils';
import { abis, addresses } from '@dex/contracts';
import { TransactionButton } from '../TransactionButtons';

export const Token = ({ title, address }) => {
  const { account } = useEthers();
  const token = useToken(address);
  const tokenBalance = useTokenBalance(address, account);
  const tokenContract = getContract(abis.token, address);
  const { state, send } = useContractFunction(tokenContract, 'mint', { transactionName: title + ' minted' });
  const [userInput, setInput] = useState(0);

  const onInput = (ev) => {
    setInput(ev.target.value);
  };

  const mintTokenTxSubmit = (input) => {
    if (input) {
      const actualInput = _18Digits(input);
      send(actualInput);
    } else {
      alert('Invalid input');
    }
  };

  return token ? (
    <div className="flex flex-col my-2">
      <h1 className="text-[32px] text-center mt-4 mb-2 font-bold">{title}</h1>
      <p>
        <b>Token name</b>: {token?.name}
      </p>
      <p>
        <b>Token symbol</b>: {token?.symbol}
      </p>
      <p>
        <b>Token decimals</b>: {token?.decimals}
      </p>
      <p>
        <b>Token totalSupply</b>: {token?.totalSupply ? prettyNum(token?.totalSupply, token?.decimals) : ''}
      </p>
      <hr className="w-32 mx-auto my-2 border-gray-500" />
      <p>
        Your balance: {tokenBalance ? prettyNum(tokenBalance, 18) : ''} {token?.symbol}
      </p>
      <div className="flex flex-row w-full space-x-2 items-center">
        <p>Faucet</p>
        <input className="flex-grow border border-gray-300 rounded px-2 py-1 my-0.5" type="number" value={userInput} onChange={onInput} />
        <TransactionButton
          onClick={() => {
            mintTokenTxSubmit(userInput);
          }}
          className="w-24"
          state={state}
          label="Mint"
        />
      </div>
    </div>
  ) : (
    <>Loading...</>
  );
};
