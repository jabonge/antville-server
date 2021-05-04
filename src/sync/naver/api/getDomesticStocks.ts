import { domesticClient } from '../client';
import { NaverDomesticStocks } from '../interfaces';

// https://m.stock.naver.com/api/stocks/marketValue/KOSPI?page=2&pageSize=100
export async function getNaverDomesticStocks(
  exchange: string,
  page: number,
  pageSize: number,
) {
  const response = await domesticClient.get<NaverDomesticStocks>(
    `/${exchange}?page=${page}&pageSize=${pageSize}`,
  );
  return response.data;
}
