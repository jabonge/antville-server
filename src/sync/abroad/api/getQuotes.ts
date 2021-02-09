import { Quote } from '../../../lib/financial-api/financial-api.interfaces';
import client from '../client';

export async function getQuotes(exchange: string) {
  const response = await client.get<Quote[]>(`/api/v3/quotes/${exchange}`);
  return response.data;
}
