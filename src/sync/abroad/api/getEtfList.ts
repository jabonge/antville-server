import { EtfStock } from '../../../lib/financial-api/financial-api.interfaces';
import client from '../client';

export async function getEtfList() {
  const response = await client.get<EtfStock[]>(`/api/v3/etf/list`);
  return response.data;
}
