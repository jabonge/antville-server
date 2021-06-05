import client from '../client';
import { EtfStock } from '../interfaces';

export async function getEtfList() {
  const response = await client.get<EtfStock[]>(`/api/v3/etf/list`);
  return response.data;
}
