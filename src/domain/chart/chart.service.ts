import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  startOfHour,
} from 'date-fns';
import { RedisClientWrapper } from '../../shared/redis/redis-client.service';
import { REDIS_CLIENT } from '../../util/constant/redis';
import { ChartInfo } from './interfaces/chart.interface';
import { UpbitService } from './upbit.service';
import { format } from 'date-fns-tz';

export enum ChartType {
  Day = '1d',
  Week = '1w',
  Month = '1m',
  SixMonth = '6m',
  Year = '1y',
}

@Injectable()
export class ChartService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly client: RedisClientWrapper,
    private readonly upbitService: UpbitService,
  ) {}

  async getCryptoChart(symbol: string, type: string) {
    const splitList = symbol.split('/');
    const market = `${splitList[1]}-${splitList[0]}`;
    const key = `${symbol}-${type}`;
    const infoKey = `${symbol}-${type}-info`;
    const chartInfoString = await this.client.getChartInfo(infoKey);
    const chartInfo = plainToClass(ChartInfo, JSON.parse(chartInfoString));

    if (!chartInfoString || this.isInValidCryptoData(type, chartInfo)) {
      const data = await this.getCryptoData(market, type);
      const newChartInfo = new ChartInfo();
      newChartInfo.lastChartDate = data[0].date;
      await this.client.setChartData(key, data);
      await this.client.setChartInfo(infoKey, JSON.stringify(newChartInfo));
      return data;
    } else {
      const data = await this.client.getChartData(key);
      return data;
    }
  }

  isInValidCryptoData(type: string, chartInfo: ChartInfo) {
    if (!chartInfo) {
      return true;
    }
    if (type === ChartType.Day) {
      const diff = differenceInMinutes(
        new Date(format(Date.now(), 'yyyy-MM-dd HH:mm')),
        new Date(chartInfo.lastChartDate),
      );
      console.log(new Date(format(Date.now(), 'yyyy-MM-dd HH:mm')));
      console.log(new Date(chartInfo.lastChartDate));
      console.log(diff);
      if (diff < 5) {
        return false;
      }
      return true;
    } else if (type === ChartType.Week) {
      const diff = differenceInHours(
        startOfHour(Date.now()),
        new Date(chartInfo.lastChartDate),
      );
      console.log(startOfHour(Date.now()));
      console.log(new Date(chartInfo.lastChartDate));
      console.log(diff);
      if (diff < 1) {
        return false;
      }
      return true;
    } else if (type === ChartType.Month || type === ChartType.SixMonth) {
      const diff = differenceInDays(
        new Date(format(Date.now(), 'yyyy-MM-dd')),
        new Date(chartInfo.lastChartDate),
      );
      console.log(new Date(format(Date.now(), 'yyyy-MM-dd')));
      console.log(new Date(chartInfo.lastChartDate));
      console.log(diff);
      if (diff < 1) {
        return false;
      }
      return true;
    } else if (type === ChartType.Year) {
      console.log(chartInfo.lastChartDate);
      const diff = differenceInDays(
        new Date(format(Date.now(), 'yyyy-MM-dd')),
        new Date(chartInfo.lastChartDate),
      );
      console.log(new Date(format(Date.now(), 'yyyy-MM-dd')));
      console.log(new Date(chartInfo.lastChartDate));
      console.log(diff);
      if (diff < 7) {
        return false;
      }
      return true;
    } else {
      throw new BadRequestException();
    }
  }

  async getCryptoData(market: string, type: string) {
    let data;
    if (type === ChartType.Day) {
      data = await this.upbitService.getCandlesBy5Min(market);
    } else if (type === ChartType.Week) {
      data = await this.upbitService.getCandlesBy1Hour(market);
    } else if (type === ChartType.Month) {
      data = await this.upbitService.getCandlesByDay(market, 30);
    } else if (type === ChartType.SixMonth) {
      data = await this.upbitService.getCandlesByDay(market, 180);
    } else if (type === ChartType.Year) {
      data = await this.upbitService.getCandlesByWeek(market, 52);
    } else {
      throw new BadRequestException();
    }
    return data;
  }
}
