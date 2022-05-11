import { abis, addresses } from '@dex/contracts';
import { formatEther, parseEther } from '@ethersproject/units';
import {
  ERC20Interface,
  useContractFunction,
  useDebounce,
  useEthers,
  useToken,
  useTokenAllowance,
  useTokenBalance,
  useEtherBalance
} from '@usedapp/core';

import { BigNumber, constants } from 'ethers';
import React, { useCallback, useEffect, useMemo, useState, Component } from 'react';
import { RiArrowUpDownLine } from 'react-icons/ri';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { envConfig } from '../../common/config';
import { UniswapUtils } from '../../common/UniswapUtils';
import { getContract, prettyNum } from '../../common/utils';
import { useApprove, useLiquidityReserve, useSwapInputHandle } from '../../hooks';
import { TransactionButton } from '../common';
import Curve from '../Curve';
import './index.css'


import Select from 'react-select';




const FEE_PERCENT = 3; // 0.3
export const Protocol = ({ token0Address, token1Address, swapPosition }) => {
    const { library, account } = useEthers();
    const poolAddress = addresses[4].pair;
    const routerAddress = addresses[4].router;
  
    //Token info
    const token0 = useToken(token0Address);
    const token1 = useToken(token1Address);
    const token0Balance = useTokenBalance(token0Address, account);
    const token1Balance = useTokenBalance(token1Address, account);
  
    //User must approve the router to spend their money before transfer
    const allowance = useTokenAllowance(token0Address, account, routerAddress);
    const [approvalState, approveToken] = useApprove(token0Address, routerAddress, 'Token Approved');
    
    //Liquidity
    const { active, r0, r1 } = useLiquidityReserve(poolAddress, token0Address, token1Address);
  
    //Input handler
    const routerContract = getContract(abis.router, routerAddress, library);
    const { price0, price1, token0InputProps, token1InputProps, exchangePrice, swapBy } = useSwapInputHandle({
      r0,
      r1,
      debounceTime: 100,
    });
  
    //Swap functions
    const useSwapHook = (method) => useContractFunction(routerContract, method, { transactionName: 'Swap successfully' });
    const { state: inputSwapState, send: swapWithInput } = useSwapHook('swapExactTokensForTokens');
    const { state: outputSwapState, send: swapWithOutput } = useSwapHook('swapTokensForExactTokens');
    const swapState = useMemo(() => {
      if (swapBy === 0) return inputSwapState;
      else return outputSwapState;
    }, [swapBy, inputSwapState, outputSwapState]);
  
    // Pool state management
    const [error, setError] = useState('Enter amount');
    const slippage = useSelector((state) => state.slippage.value);
    const { value: deadline, toSec } = useSelector((state) => state.deadline);
  
    useEffect(() => {
      if (price0 && price1 && token0Balance && r1) {
        if (price0.isZero() || price1.isZero()) setError('Input invalid ');
        else if (price0.gt(token0Balance)) setError("Insufficient user's balance");
        else if (price1.gt(r1)) setError('Insufficient liquidity');
        else setError(null);
      }
    }, [price0, price1, r1, token0Balance]);
  
    const onApprove = (ev) => {
      ev.preventDefault();
      approveToken();
    };
  

  
 
    const { one, two } = addresses['4'];
    const balanceETH= useEtherBalance(account);
    let options = [
      { value: account, label: 'ETH'},
      { value: one, label: 'ONE' },
      { value: two, label: 'TWO' }
    ]

    
    
  
    const [value1,setValue1]=useState();
    //token0Balance=useTokenBalance(value1, account);
    const handleChange1=(value)=>{
      
      setValue1(value);
 
      console.log(value1);

    }
    const [value2,setValue2]=useState('');
    // token1Balance = useTokenBalance(value2, account);
    const handleChange2=(value)=>{
      
      setValue2(value);

      console.log(value2);

    }


  const selectionStyle={
    control: (styles)=>({...styles, backgroundColor: '#0066FF', borderRadius:'1.5rem',"&:hover": {
      backgroundColor: "#3399FF"
    } }),

   
    placeholder: (styles) => ({ ...styles, color:'white' }),
    singleValue: (styles) => ({ ...styles, color:'white'}),

  };
  const [swapLimit,setSwapLimit]=useState(false);
  const onSwapLimit =(status) =>{
    status.preventDefault();
    setSwapLimit((status)=>!status)
  };
    return active && token0 && token1 ? (
      <>
        <form className="tag" >
          <h1 className="font-bold text-[32px] ml-2  ">Limit order</h1>
  
            
            <div className="labelBox flex flex-row space-x-2 my-2 ">
          <label className="w-40 font-bold ml-2 ">
        
             <Select  styles={selectionStyle} className ="w-21 " isOptionDisabled={(option) => option.disabled}  value={swapLimit? value1:value2} placeholder='Select Token' onChange={swapLimit?handleChange1:handleChange2} options={options}  />
              
         
            <br />
         Balance: {token0Balance && prettyNum(token0Balance, token0.decimals)}
          </label>
          
          <input {...token0InputProps}  style={{fontSize:'25px'}} className="  flex-grow px-2 py-1 inputBox " placeholder="0.0" />
        </div>
        <button
          className="rounded-full border border-gray-300 hover:bg-gray-200 w-6 h-6 flex justify-center items-center ml-auto"
          onClick={onSwapLimit}
        >
          <RiArrowUpDownLine />
        </button>
        <div className=" labelBox flex flex-row space-x-2 my-2 ">
          <label className="w-40 font-bold ml-3">
            Price
          </label>
          <input {...token1InputProps} style={{fontSize:'25px'}}  className="inputBox  rounded flex-grow px-2 py-1" placeholder="0.0" />
        </div>  
        <div className="labelBox flex flex-row space-x-2 my-2 ">
          <label className="w-40 font-bold ml-2">

          <Select   className ="w-30 m-0" isOptionDisabled={(options)=>options.isdisabled} styles={selectionStyle} value={swapLimit?value2:value1} placeholder='Select Token' onChange={swapLimit?handleChange2:handleChange1} options={options} />
             <br />
            Balance: {token1Balance && prettyNum(token1Balance, token1.decimals)}
          </label>
          <input {...token1InputProps}  style={{fontSize:'25px'}} className="inputBox rounded flex-grow px-2 py-1" placeholder="0.0" />
        </div>    
        <label className=" text-gray-800 hover:underline hover:cursor-pointer py-1 text-[8px] ">
              {exchangePrice && (
                <>
                  1 {token0.symbol} = {exchangePrice} {token1.symbol}
                </>
              )}
            </label>
        <div>
        <button className="btnSetLimit ">Set limit</button>
            
        </div>
        
        </form>
       
      </>
    ) : (
      <p>Loading...</p>
    );
  };
  