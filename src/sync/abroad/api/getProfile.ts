import { StockProfile } from './../../../lib/financial-api/financial-api.interfaces';
import client from '../client';

export async function getStockProfile(symbol: string) {
  const response = await client.get<StockProfile[]>(
    `/api/v3/profile/${symbol}`,
  );
  return response.data[0];
}
