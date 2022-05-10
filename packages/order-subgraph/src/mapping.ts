import { BigInt } from '@graphprotocol/graph-ts';
import {
  OrderProtocol,
  OrderCancelled,
  OrderCreated,
  OrderExecuted,
  VaultDeposited,
  VaultWithdrawed,
} from '../generated/OrderProtocol/OrderProtocol';
import { Order } from '../generated/schema';

export const OPEN = 'open';
export const EXECUTED = 'executed';
export const CANCELLED = 'cancelled';

export function handleOrderCreated(event: OrderCreated): void {
  let order = new Order(event.params._key.toHex());

  order.module = event.params._module.toHex();
  order.inputToken = event.params._inputToken.toHex();
  order.owner = event.params._owner.toHex();
  order.witness = event.params._witness.toHex();
  order.amount = event.params._amount;
  order.secret = event.params._secret.toHex();
  order.data = event.params._data;
  order.status = OPEN;

  order.createdTxHash = event.transaction.hash;
  order.createdAt = event.block.timestamp;
  order.updatedAt = event.block.timestamp;
}

export function handleOrderCancelled(event: OrderCancelled): void {
  let order = Order.load(event.params._key.toHex());
  if (order == null) {
    return;
  }

  order.cancelledTxHash = event.transaction.hash;
  order.status = CANCELLED;
  order.updatedAt = event.block.timestamp;

  order.save();
}

export function handleOrderExecuted(event: OrderExecuted): void {
  let order = Order.load(event.params._key.toHex());
  if (order == null) {
    return;
  }

  order.bought = event.params._bought;
  order.auxData = event.params._auxData;

  // Skip padding 0, read address of handler from auxData (20 bytes)
  order.handler = '0x' + event.params._auxData.toHex().substr(2 + 24, 40);

  order.executedTxHash = event.transaction.hash;
  order.status = EXECUTED;
  order.updatedAt = event.block.timestamp;

  order.save();
}
