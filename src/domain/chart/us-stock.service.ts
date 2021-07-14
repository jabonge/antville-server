import {
  ChartData,
  UsStockCandleData,
  UsStockDayFullData,
} from './interfaces/chart.interface';
import { HttpService, Injectable } from '@nestjs/common';
import { format } from 'date-fns-tz';
import { dayFormat, nyTimeZone } from '../../util/constant/time';
import { getDay, isAfter, isBefore, toDate } from 'date-fns';

@Injectable()
export class UsStockApiService {
  private readonly baseUrl = 'https://financialmodelingprep.com/api/v3';
  private readonly holidays = ['2021-12-24', '2021-11-25', '2021-09-06'];
  constructor(private httpService: HttpService) {}

  async getCandlesBy5Min(market: string, from: string, to: string) {
    let { data } = await this.httpService
      .get<UsStockCandleData[]>(
        `${this.baseUrl}/historical-chart/5min/${market}?apikey=${process.env.FINANCIAL_API_KEY}&from=${from}&to=${to}`,
      )
      .toPromise();
    console.log(from);
    console.log(to);
    if (data.length > 79) {
      data = data.slice(0, 79);
    }
    const date = data[0].date.split(' ')[0];
    data = data.filter((v) => v.date.split(' ')[0] === date);
    return data;
  }

  async getCandlesBy30Min(market: string, from: string, to: string) {
    const { data } = await this.httpService
      .get<UsStockCandleData[]>(
        `${this.baseUrl}/historical-chart/30min/${market}?apikey=${process.env.FINANCIAL_API_KEY}&from=${from}&to=${to}`,
      )
      .toPromise();
    return data.map((v) => ChartData.usCandleToChartData(v));
  }

  async getCandlesByDay(market: string, from: string, to: string) {
    const { data } = await this.httpService
      .get<UsStockDayFullData>(
        `${this.baseUrl}/historical-price-full/${market}?apikey=${process.env.FINANCIAL_API_KEY}&from=${from}&to=${to}`,
      )
      .toPromise();

    return data.historical.map((v) => ChartData.usCandleToChartData(v));
  }

  isUsStockMarketOpen = () => {
    const now = new Date(Date.now());
    if (this.isUsStockMarketHoliday(now)) {
      return false;
    }
    const startTime = toDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        process.env.NODE_ENV === 'local' ? 22 : 13,
        30,
        0,
      ),
    );
    const endTime = toDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        process.env.NODE_ENV === 'local' ? now.getDate() + 1 : now.getDate(),
        process.env.NODE_ENV === 'local' ? 5 : 20,
        0,
        0,
      ),
    );
    if (isAfter(now, startTime) && isBefore(now, endTime)) {
      return true;
    }
    return false;
  };

  isUsStockMarketHoliday(now: Date) {
    const formatString = format(now, dayFormat, {
      timeZone: nyTimeZone,
    });
    const day = getDay(now);
    if (day === 0 || day === 6) {
      return true;
    } else {
      return this.holidays.some((v) => v === formatString);
    }
  }

  isIncludeStockMaketTime(now: Date, updatedAt: Date) {
    if (this.isUsStockMarketHoliday(now)) {
      return false;
    } else {
      const endTime = toDate(
        new Date(
          now.getFullYear(),
          now.getMonth(),
          process.env.NODE_ENV === 'local' ? now.getDate() + 1 : now.getDate(),
          process.env.NODE_ENV === 'local' ? 5 : 20,
          0,
          0,
        ),
      );
      if (isBefore(updatedAt, endTime) && isAfter(now, endTime)) {
        return true;
      }
      return false;
    }
  }
}
