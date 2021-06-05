import client from '../client';
import { StockProfile } from '../interfaces';

export async function getStockProfile(symbol: string) {
  const response = await client.get<StockProfile[]>(
    `/api/v3/profile/${symbol}`,
  );
  return response.data[0];
}
