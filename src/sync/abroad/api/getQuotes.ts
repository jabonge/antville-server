import client from '../client';
import { Quote } from '../interfaces';

export async function getQuotes(exchange: string) {
  const response = await client.get<Quote[]>(`/api/v3/quotes/${exchange}`);
  return response.data;
}

export async function getQuote(symbol: string) {
  const response = await client.get<Quote[]>(`/api/v3/quote/${symbol}`);
  return response.data[0];
}
