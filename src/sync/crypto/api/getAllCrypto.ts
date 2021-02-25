import { ICrypto } from '../interfaces';
import client from '../client';

export const getCryptoList = async () => {
  const response = await client.get<[ICrypto]>('/market/all');
  return response.data;
};
