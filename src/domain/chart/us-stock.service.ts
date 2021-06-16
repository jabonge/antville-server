import {
  ChartData,
  UsStockCandleData,
  UsStockDayFullData,
} from './interfaces/chart.interface';
import { HttpService, Injectable } from '@nestjs/common';

@Injectable()
export class UsStockApiService {
  private readonly baseUrl = 'https://financialmodelingprep.com/api/v3';
  constructor(private httpService: HttpService) {}

  async getCandlesBy5Min(market: string, from: string, to: string) {
    console.log('5min network call');
    let { data } = await this.httpService
      .get<UsStockCandleData[]>(
        `${this.baseUrl}/historical-chart/5min/${market}?apikey=${process.env.FINANCIAL_API_KEY}&from=${from}&to=${to}`,
      )
      .toPromise();
    if (data.length > 79) {
      data = data.slice(0, data.length - 79);
    }
    return data.map((v) => ChartData.usCandleToChartData(v));
  }

  async getCandlesBy30Min(market: string, from: string, to: string) {
    console.log('30Min network call');
    const { data } = await this.httpService
      .get<UsStockCandleData[]>(
        `${this.baseUrl}/historical-chart/30min/${market}?apikey=${process.env.FINANCIAL_API_KEY}&from=${from}&to=${to}`,
      )
      .toPromise();
    return data.map((v) => ChartData.usCandleToChartData(v));
  }

  async getCandlesByDay(market: string, from: string, to: string) {
    console.log('1day network call');
    const { data } = await this.httpService
      .get<UsStockDayFullData>(
        `${this.baseUrl}/historical-price-full/${market}?apikey=${process.env.FINANCIAL_API_KEY}&from=${from}&to=${to}`,
      )
      .toPromise();

    return data.historical.map((v) => ChartData.usCandleToChartData(v));
  }
}
