import { ethers, Wallet } from 'ethers';
import OrderProtocolAbi from './abis/OrderProtocol.json';
const One = '0xE347Cd0934E878B236DcCF82fe419A92404Da229';
const Two = '0xE73bcbaF9ff36D66C5b7805c8c64D389FD7fdb75';
const OrderProtocol = '0xa9cd06edf421373f7dd86fb26268c7995a872327';
const LimitOrderModule = '0xdf84e38277bd7634efc132c9caf71a8a12484a09';
// const UniswapV2Handler = '0x1931ef747c1ff9b5290409684e35ed95e0d76066';

const PRVKEY =
  'b7827bd013c0517a0c58c29b33a4c1713f8eb9fffa322f608058557aa42462de';
(async () => {
  const AMOUNT_IN = ethers.utils.parseEther('1');
  const AMOUNT_OUT = ethers.utils.parseEther('5');

  const provider = new ethers.providers.JsonRpcProvider(
    'https://rinkeby.infura.io/v3/9790bda3dc49412ea06c22055b3489b7'
  );
  const account = new Wallet(PRVKEY, provider);
  const coreContract = new ethers.Contract(
    OrderProtocol,
    OrderProtocolAbi,
    account
  );
  const tokenOneContract = new ethers.Contract(
    One,
    [
      'function approve(address,uint256) returns (bool)',
      'function balanceOf(address) view returns (uint)',
    ],
    account
  );

  const abiEncoder = new ethers.utils.AbiCoder();
  const secret = ethers.utils
    .hexlify(ethers.utils.randomBytes(21))
    .replace('0x', '');
  const fullSecret = `2022001812713618127252${secret}`;
  const { privateKey: witnessPrvKey, address: witnessAddress } =
    new ethers.Wallet(fullSecret);
  console.log('Witness: prvKey, address ', witnessPrvKey, witnessAddress);

  const orderParams = [
    LimitOrderModule,
    One,
    account.address,
    witnessAddress,
    AMOUNT_IN,
    abiEncoder.encode(['address', 'uint256'], [Two, AMOUNT_OUT]),
    witnessPrvKey,
  ];

  console.log(
    `Trying to create order ${AMOUNT_IN}ONE=${AMOUNT_OUT}TWO. Owner: ${
      account.address
    }, ONE balance = ${await tokenOneContract.balanceOf(account.address)}`
  );
  await tokenOneContract.approve(OrderProtocol, AMOUNT_IN);
  try {
    await coreContract.createOrder(...orderParams);
  } catch (err: any) {
    console.error('Tx reverted, reason: ', err.reason);
  }
  console.log('Finish create order');
})();

// prv 0x20220018127136181272524a57ff065ba8775b7233557e886a0704a2ae761c29
// addres 0xA32B82398A0f645253a024eeA49A0D2C40653b25

// (async () => {
//   const provider = new ethers.providers.JsonRpcProvider(
//     'https://rinkeby.infura.io/v3/9790bda3dc49412ea06c22055b3489b7'
//   );
//   // const oneContract = new ethers.Contract(
//   //   '0xE347Cd0934E878B236DcCF82fe419A92404Da229',
//   //   ['function balanceOf(address) view returns (uint)'],
//   //   provider
//   // );
//   const contract = new ethers.Contract(
//     '0xe347cd0934e878b236dccf82fe419a92404da229',
//     ['function balanceOf(address) view returns (uint)'],
//     provider
//   );
//   console.log(
//     'Vault balance: ',
//     await contract.balanceOf('0xd0a9a25055127Bf14ae948dE572d9C67Bc556085')
//   );
// })();
