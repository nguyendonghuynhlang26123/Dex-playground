import { NETWORK_NAMES } from './constants';
import { log } from './logger';
export const getEnvConfig = () => {
  const nodeUrl = process.env.NODE_URL;
  const chainId = process.env.CHAIN_ID;
  const graphUrl = process.env.PROTOCOL_SUBGRAPH_URL;
  const orderCheckInterval = Number(process.env.TIME_BETWEEN_CHECKS) || 60000; //1min

  const CORE_CONTRACT = process.env.CORE_CONTRACT;

  const LIMIT_ORDER_UNISWAP_HANDLER = process.env.LIMIT_ORDER_UNISWAP_HANDLER;

  let SENDER_PRIVKEY = process.env.SENDER_PRIVATE_KEY;

  const MAX_GAS_PRICE = Number(process.env.MAX_GAS_PRICE) || 200000000000; // 200 GWEI

  if (chainId === undefined) {
    throw new Error('CHAIN_ID undefined');
  }

  const network = NETWORK_NAMES[chainId];
  if (!network) {
    throw new Error('INVALID NETWORK');
  }

  if (!graphUrl) {
    throw new Error('Subgraph Endpoint for querying must be specified');
  }

  if (!CORE_CONTRACT) throw new Error('Please provide core contract address');
  if (!SENDER_PRIVKEY)
    throw new Error("Please difine sender's private key to sign transactions");
  else {
    SENDER_PRIVKEY = SENDER_PRIVKEY.startsWith('0x')
      ? SENDER_PRIVKEY
      : `0x${SENDER_PRIVKEY}`;
  }

  log.info(`Node: ${nodeUrl}`);
  log.info(`Chain: ${network} (chainId=${chainId})`);
  log.info(`Subgraph: ${graphUrl}`);
  log.info(`Order is checked every ${orderCheckInterval / 1000}s`);

  return {
    chainId,
    nodeUrl,
    network,
    graphUrl,
    checkInterval: orderCheckInterval,
    CORE_CONTRACT,
    SENDER_PRIVKEY,
    LIMIT_ORDER_UNISWAP_HANDLER,
    MAX_GAS_PRICE,
  };
};
