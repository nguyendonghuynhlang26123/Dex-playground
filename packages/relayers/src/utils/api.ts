import { Order } from '../types/Order';
import axios from 'axios';

export const getOpenOrders = async (url: string): Promise<Order[]> => {
  const query = `{
    orders( where: { status: open }) {
      id
      module,
      inputToken,
      owner,
      witness,
      amount,
      data,   
      secret,
      createdTxHash
    }
  }`;

  try {
    const res = await axios.post(
      url,
      JSON.stringify({
        query,
      })
    );
    const { data } = res.data;

    return data.orders;
  } catch (e: any) {
    throw new Error(
      `API: Error getting orders at getOpenOrdersFromBlock: ${e.message}`
    );
  }
};
