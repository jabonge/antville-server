import { ChartData, UpbitCandleData } from './interfaces/chart.interface';
import { HttpService, Injectable } from '@nestjs/common';

@Injectable()
export class UpbitService {
  private readonly baseUrl = 'https://api.upbit.com/v1/candles';
  constructor(private httpService: HttpService) {}

  async getCandlesBy5Min(market: string) {
    const { data } = await this.httpService
      .get<UpbitCandleData[]>(
        `${this.baseUrl}/minutes/5?market=${market}&count=144`,
      )
      .toPromise();
    return data.map((v) => ChartData.upbitCandleToChartData(v));
  }

  async getCandlesBy1Hour(market: string) {
    const { data } = await this.httpService
      .get<UpbitCandleData[]>(
        `${this.baseUrl}/minutes/60?market=${market}&count=144`,
      )
      .toPromise();
    return data.map((v) => ChartData.upbitCandleToChartData(v));
  }

  async getCandlesByDay(market: string, count: number) {
    const { data } = await this.httpService
      .get<UpbitCandleData[]>(
        `${this.baseUrl}/days?count=${count}&market=${market}`,
      )
      .toPromise();

    return data.map((v) => ChartData.upbitCandleToChartData(v));
  }

  async getCandlesByWeek(market: string, count: number) {
    const { data } = await this.httpService
      .get<UpbitCandleData[]>(
        `${this.baseUrl}/weeks?count=${count}&market=${market}`,
      )
      .toPromise();

    return data.map((v) => ChartData.upbitCandleToChartData(v));
  }
}
