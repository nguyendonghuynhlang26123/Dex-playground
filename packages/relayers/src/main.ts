import { BASE_FEE, TIPS } from './utils/constants';
import { Order } from './types';
import { ethers, Wallet } from 'ethers';
import { log, getEnvConfig, getOpenOrders } from './utils';
import OrderProtocolAbi from './abis/OrderProtocol.json';
import dotenv from 'dotenv';
dotenv.config();

const telegram = (msg: string) => log.log('http', msg);

const sign = async (address: string, secret: string) => {
  const signer = new ethers.Wallet(secret);
  return await signer.signMessage(
    ethers.utils.arrayify(
      ethers.utils.keccak256(ethers.utils.solidityPack(['address'], [address]))
    )
  );
};

const getOrderExecutionParams = async (
  order: Order,
  signature: string,
  relayerData: string
) => {
  return [
    order.module,
    order.inputToken,
    order.owner,
    order.amount,
    order.data,
    signature,
    relayerData,
  ];
};

const start = async () => {
  let previousCount = 0;
  const envConfig = getEnvConfig();

  const abiEncoder = new ethers.utils.AbiCoder();
  const provider = new ethers.providers.JsonRpcProvider(envConfig.nodeUrl);
  const account = new Wallet(envConfig.SENDER_PRIVKEY, provider);
  const coreProtocol = new ethers.Contract(
    envConfig.CORE_CONTRACT,
    OrderProtocolAbi,
    account
  );

  const accountInitBalance = await provider.getBalance(account.address);
  if (accountInitBalance.lt(ethers.BigNumber.from('100000000000000000'))) {
    throw new Error(
      'Account must has at least 0.01 ETH to be used as a relayer'
    );
  }

  const estimateGasExecution = async (params: any[], gasPrice: any) => {
    try {
      return await coreProtocol.estimateGas.executeOrder(...params, {
        gasPrice,
      });
    } catch (e: any) {
      log.debug(`Estimate gas exception, Error: ${e?.error?.body}`);
      log.verbose(
        `Could not estimate gas. Execution may reverted. Reason: ${e?.error?.body?.message}`
      );
      return undefined;
    }
  };

  const handleOrder = async (order: Order) => {
    log.info(`Trying to execute order ${order.id}`);
    const signature = await sign(account.address, order.secret);
    let executeParams = await getOrderExecutionParams(
      order,
      signature,
      abiEncoder.encode(
        ['address', 'address', 'uint256'],
        [
          envConfig.LIMIT_ORDER_UNISWAP_HANDLER,
          account.address,
          BASE_FEE.toString(),
        ]
      )
    );

    // 2. Check everything in order not to wasting any tx cost for a reverted transaction
    // 2a. Estimate the gas sender have to pay
    let gasPrice = TIPS.add(await provider.getGasPrice());

    let estimatedGas = await estimateGasExecution(executeParams, gasPrice);
    if (!estimatedGas) return;

    if (gasPrice.toNumber() > envConfig.MAX_GAS_PRICE) {
      log.warn(
        'Gas price too high at the moment, try again in the next attempt'
      );
      return;
    }
    const fee = estimatedGas.mul(gasPrice).add(BASE_FEE);

    log.debug(
      `Estimation complete, estimated fee for this order: ${ethers.utils.formatEther(
        fee
      )} ETH`
    );

    // 2b: Simulate the order execution in order not to have some unwanted reverts
    const gasLimit = estimatedGas.add(ethers.BigNumber.from(50000));
    executeParams = await getOrderExecutionParams(
      order,
      signature,
      abiEncoder.encode(
        ['address', 'address', 'uint256'],
        [
          envConfig.LIMIT_ORDER_UNISWAP_HANDLER,
          account.address,
          fee.toString(), // Update fee for this order
        ]
      )
    );

    try {
      // simulate
      await coreProtocol.callStatic.executeOrder(...executeParams, {
        from: account.address,
        gasLimit,
        gasPrice,
      });
    } catch (e: any) {
      log.warn(
        `Execute simulation for order ${order.id} failed! Reason: ${e.reason} `
      );
      return;
    }

    // 3. When every thing is checked,  perform execute transaction
    try {
      const tx = await coreProtocol.executeOrder(...executeParams, {
        from: account.address,
        gasLimit,
        gasPrice,
      });

      // log.info(`Filled ${order.id} order, executedTxHash: ${tx.hash}`);
      telegram(
        `Order ${order.id} filled! Fee = ${ethers.utils.formatEther(
          fee
        )} ETH (price = ${ethers.utils.formatUnits(
          gasPrice,
          'gwei'
        )} gwei, gas = ${estimatedGas.toString()}). Owner = ${
          order.owner
        }, inputToken = ${order.inputToken}, amount = ${order.amount}, data=${
          order.data
        }. Order on ethscan = https://rinkeby.etherscan.io/tx/${
          order.createdTxHash
        }`
      );
      return tx.hash;
    } catch (e: any) {
      log.warn(`Failed to executing order ${order.id}: ${e.reason} `);
    }
  };

  const handleOrderJob = async () => {
    // 1. Fetch all order
    const openOrders = await getOpenOrders(envConfig.graphUrl);

    log.info('-------------------------\n');
    log.info(
      `Start new watching round. Order fetched: ${openOrders.length} orders.`
    );

    // 2. Notify devs team :D
    if (previousCount < openOrders.length) {
      const listOrder = openOrders.map((o) => o.createdTxHash);
      telegram(
        `${
          openOrders.length - previousCount
        } orders are newly created! Order hashes: ${listOrder.toString()}`
      );
    }
    previousCount = openOrders.length;

    // 3. Loop and check each order:
    for (const order of openOrders) {
      const result = await handleOrder(order);

      if (!result) {
        log.info(`Executor: Order not ready to be filled ${order.id}`);
        // setTimeout(
        //   async () => await handleOrder(order),
        //   Number(process.env.ORDERS_CHECK_LOOP_TIME) || 15000
        // );
      }
    }

    const currentBalance = await provider.getBalance(account.address);
    const diff = currentBalance.sub(accountInitBalance);
    log.info(
      `Finish watching round. Current balance: ${ethers.utils.formatUnits(
        currentBalance
      )} (${ethers.utils.formatEther(diff)} ETH)`
    );
  };

  const loop = async () => {
    await handleOrderJob();
    setTimeout(loop, Number(envConfig.checkInterval));
  };

  telegram('Relayer started');
  await loop();
};

if (require.main === module) {
  log.info('_____________ START RELAYER  _____________');
  Promise.resolve()
    .then(() => start())
    .catch(log.error);
}
