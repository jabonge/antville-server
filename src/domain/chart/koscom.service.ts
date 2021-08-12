import {
  ChartData,
  KoscomHistoryData,
  KoscomIntradayData,
} from './interfaces/chart.interface';
import { HttpService, Injectable } from '@nestjs/common';
import { hourMinuteFormat } from '../../util/constant/time';

import { Stock } from '../stock/entities/stock.entity';
import moment from 'moment';

export enum MarketStatus {
  Holiday = 'Holiday',
  Pre = 'Pre',
  Post = 'Post',
  Open = 'Open',
}

@Injectable()
export class KoscomApiService {
  private readonly apiKey = process.env.KOSCOM_API_KEY;
  private readonly baseUrl = `https://${process.env.KOSCOM_HOST_URL}/v2/market/stocks`;
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
        moment(
          Date.parse(
            [
              startDay.slice(0, 4),
              startDay.slice(4, 6),
              startDay.slice(6, 8),
            ].join('-') +
              ' ' +
              [time.slice(0, 2), time.slice(2, 4)].join(':'),
          ),
        ).format(hourMinuteFormat),
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
}
