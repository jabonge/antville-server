import { KoreaStockList } from './../interfaces';
import client from '../client';

export async function getKoreaStockList(marketCode: string) {
  const response = await client.get<KoreaStockList>(
    `/stocks/${marketCode}/lists`,
  );
  return response.data;
}
