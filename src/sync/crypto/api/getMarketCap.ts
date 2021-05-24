import { ICryptoMarketCap } from '../interfaces';
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://crix-api-cdn.upbit.com/v1/crix/marketcap?currency=KRW',
});
export const getMarketCapList = async () => {
  const response = await client.get<[ICryptoMarketCap]>('');
  return response.data;
};
