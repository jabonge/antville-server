import {
  ChartData,
  KoscomHistoryData,
  KoscomIntradayData,
} from './interfaces/chart.interface';
import { HttpService, Injectable } from '@nestjs/common';
import { format, utcToZonedTime } from 'date-fns-tz';
import {
  dayFormat,
  hourMinuteFormat,
  krTimeZone,
} from '../../util/constant/time';
import { addHours, getDay, isAfter, isBefore } from 'date-fns';
import { Stock } from '../stock/entities/stock.entity';
import { MarketStatus } from './chart.service';

@Injectable()
export class KoscomApiService {
  private readonly apiKey = process.env.KOSCOM_API_KEY;
  private readonly baseUrl = `https://${process.env.KOSCOM_HOST_URL}/v2/market/stocks`;
  private readonly holidays = [
    '2021-12-31',
    '2021-10-11',
    '2021-09-22',
    '2021-09-21',
    '2021-09-20',
    '2021-08-16',
  ];
  constructor(private httpService: HttpService) {}

  async getCandlesBy5Min(stock: Stock, startDay: string) {
    const { data } = await this.httpService
      .get<KoscomIntradayData>(
        `${this.baseUrl}/${stock.exchange.name.toLowerCase()}/${
          stock.symbol
        }/intraday?apikey=${
          this.apiKey
        }&inqStrtDd=${startDay}&strtTm=0900&endTm=1530&inddCycleTpCd=300`,
      )
      .toPromise();
    return data.result.hisLists.map((v) => {
      const time =
        v.inddTm.length > 7
          ? v.inddTm.substring(0, 4)
          : '0' + v.inddTm.substring(0, 3);
      return ChartData.koscomIntradayToChartData(
        format(
          Date.parse(
            [
              startDay.slice(0, 4),
              startDay.slice(4, 6),
              startDay.slice(6, 8),
            ].join('-') +
              ' ' +
              [time.slice(0, 2), time.slice(2, 4)].join(':'),
          ),
          hourMinuteFormat,
        ),
        v,
      );
    });
  }

  async getCandlesByDay(
    stock: Stock,
    type: string,
    from: string,
    to: string,
    count: number,
  ) {
    const { data } = await this.httpService
      .get<KoscomHistoryData>(
        `${this.baseUrl}/${stock.exchange.name.toLowerCase()}/${
          stock.symbol
        }/history?apikey=${
          this.apiKey
        }&trnsmCycleTpCd=${type}&inqStrtDd=${from}&inqEndDd=${to}&reqCnt=${count}`,
      )
      .toPromise();
    return data.result.hisLists.map((v) =>
      ChartData.koscomHistoryToChartData(v),
    );
  }

  getKoreaStockMarketStatus = () => {
    const now = new Date(Date.now());
    if (this.isKoreaStockMarketHoliday(now)) {
      return MarketStatus.Holiday;
    }
    const startTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      process.env.NODE_ENV === 'local' ? 9 : 0,
      0,
      0,
    );
    const endTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      process.env.NODE_ENV === 'local' ? now.getDate() : now.getDate() + 1,
      process.env.NODE_ENV === 'local' ? 15 : 4,
      30,
      0,
    );
    if (isAfter(now, startTime) && isBefore(now, endTime)) {
      return MarketStatus.Open;
    }
    if (isBefore(now, startTime)) {
      return MarketStatus.Pre;
    } else if (isAfter(now, endTime)) {
      return MarketStatus.Post;
    }
    throw new Error('Unsupported Status');
  };

  isKoreaStockMarketHoliday(now: Date) {
    const formatString = format(now, dayFormat, {
      timeZone: krTimeZone,
    });
    const day = getDay(now);
    if (day === 0 || day === 6) {
      return true;
    } else {
      return this.holidays.some((v) => v === formatString);
    }
  }

  isIncludeStockMaketTime(now: Date, updatedAt: Date) {
    if (this.isKoreaStockMarketHoliday(now)) {
      return false;
    } else {
      const krUpdateTime = utcToZonedTime(
        process.env.NODE_ENV === 'local' ? addHours(updatedAt, 9) : updatedAt,
        krTimeZone,
      );
      const endTime = new Date(
        krUpdateTime.getFullYear(),
        krUpdateTime.getMonth(),
        updatedAt.getDate(),
        15,
        30,
        0,
      );
      if (isBefore(updatedAt, endTime) && isAfter(now, endTime)) {
        return true;
      }
      return false;
    }
  }
}
