import { aboardClient } from '../client';
import { NaverAboardStocks } from '../interfaces';

export async function getNaverAboardStocks(
  exchange: string,
  page: number,
  pageSize: number,
) {
  const response = await aboardClient.get<NaverAboardStocks>(
    `/${exchange}/marketValue?page=${page}&pageSize=${pageSize}`,
  );
  return response.data;
}
