import client from './client';

export async function getXml(symbol: string) {
  const response = await client.get<string>('', {
    params: {
      code: symbol,
    },
  });
  return response.data;
}
