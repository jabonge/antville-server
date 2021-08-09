import { KoscomApiService } from './koscom.service';
import { krDayFormat, krTimeZone } from './../../util/constant/time';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import {
  addHours,
  differenceInDays,
  differenceInMinutes,
  getDay,
  parseISO,
  startOfHour,
  subDays,
  subHours,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { RedisClientWrapper } from '../../shared/redis/redis-client.service';
import { REDIS_CLIENT } from '../../util/constant/redis';
import { ChartInfo } from './interfaces/chart.interface';
import { UpbitService } from './upbit.service';
import { format, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { UsStockApiService } from './us-stock.service';
import {
  dayFormat,
  hourMinuteFormat,
  nyTimeZone,
} from '../../util/constant/time';
import differenceInHours from 'date-fns/differenceInHours';
import { Stock } from '../stock/entities/stock.entity';

export enum ChartType {
  Day = '1d',
  Week = '1w',
  Month = '1m',
  ThreeMonth = '3m',
  SixMonth = '6m',
  Year = '1y',
}

export enum MarketStatus {
  Holiday = 'Holiday',
  Pre = 'Pre',
  Post = 'Post',
  Open = 'Open',
}

@Injectable()
export class ChartService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly client: RedisClientWrapper,
    private readonly upbitService: UpbitService,
    private readonly usStockApiService: UsStockApiService,
    private readonly koscomApiService: KoscomApiService,
  ) {}

  async getCryptoChart(symbol: string, type: ChartType) {
    const splitList = symbol.split('/');
    const market = `${splitList[1]}-${splitList[0]}`;
    const key = `${symbol}-${type}`;
    const infoKey = `${symbol}-${type}-info`;
    const chartInfoString = await this.client.getChartInfo(infoKey);
    const chartInfo = plainToClass(ChartInfo, JSON.parse(chartInfoString));

    if (!chartInfoString || this.isInValidCryptoData(type, chartInfo)) {
      const data = await this.getCryptoData(market, type);
      const newChartInfo = new ChartInfo();
      newChartInfo.lastChartDate = format(
        zonedTimeToUtc(data[0].date, krTimeZone),
        hourMinuteFormat,
      );
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
      const now = new Date(format(Date.now(), hourMinuteFormat));
      const lastChartDate = new Date(chartInfo.lastChartDate);
      const diff = differenceInMinutes(now, lastChartDate);
      if (diff < 5) {
        return false;
      }
      return true;
    } else if (type === ChartType.Week) {
      const now = new Date(startOfHour(Date.now()));
      const lastChartDate = new Date(chartInfo.lastChartDate);
      const diff = differenceInHours(now, lastChartDate);
      if (diff < 1) {
        return false;
      }
      return true;
    } else if (
      type === ChartType.Month ||
      type == ChartType.ThreeMonth ||
      type === ChartType.SixMonth
    ) {
      const now = new Date(format(Date.now(), dayFormat));
      const lastChartDate = new Date(
        format(parseISO(chartInfo.lastChartDate), dayFormat),
      );
      const diff = differenceInDays(now, lastChartDate);
      if (diff < 1) {
        return false;
      }
      return true;
    } else if (type === ChartType.Year) {
      const now = new Date(format(Date.now(), dayFormat));
      const lastChartDate = new Date(
        format(parseISO(chartInfo.lastChartDate), dayFormat),
      );
      const diff = differenceInDays(now, lastChartDate);
      if (diff < 7) {
        return false;
      }
      return true;
    } else {
      throw new BadRequestException();
    }
  }

  async getCryptoData(market: string, type: ChartType) {
    let data;
    if (type === ChartType.Day) {
      data = await this.upbitService.getCandlesBy5Min(market);
    } else if (type === ChartType.Week) {
      data = await this.upbitService.getCandlesBy1Hour(market);
    } else if (type === ChartType.Month) {
      data = await this.upbitService.getCandlesByDay(market, 30);
    } else if (type === ChartType.ThreeMonth) {
      data = await this.upbitService.getCandlesByDay(market, 90);
    } else if (type === ChartType.SixMonth) {
      data = await this.upbitService.getCandlesByDay(market, 180);
    } else if (type === ChartType.Year) {
      data = await this.upbitService.getCandlesByWeek(market, 52);
    } else {
      throw new BadRequestException();
    }
    return data;
  }

  async getUsStockChart(symbol: string, type: ChartType) {
    const key = `${symbol}-${type}`;
    const infoKey = `${symbol}-${type}-info`;
    const chartInfoString = await this.client.getChartInfo(infoKey);
    const chartInfo = plainToClass(ChartInfo, JSON.parse(chartInfoString));
    const isOpen = this.usStockApiService.isUsStockMarketOpen();

    if (
      !chartInfoString ||
      this.isInValidUsStockData(type, chartInfo, isOpen)
    ) {
      const data = await this.getUsStockData(symbol, type, isOpen);
      const newChartInfo = new ChartInfo();
      newChartInfo.lastChartDate = format(
        zonedTimeToUtc(data[0].date, nyTimeZone),
        hourMinuteFormat,
      );
      newChartInfo.updatedAt = format(Date.now(), hourMinuteFormat);
      await this.client.setChartData(key, data);
      await this.client.setChartInfo(infoKey, JSON.stringify(newChartInfo));
      return data;
    } else {
      const data = await this.client.getChartData(key);
      return data;
    }
  }

  isInValidUsStockData(type: string, chartInfo: ChartInfo, isOpen: boolean) {
    if (!chartInfo) {
      return true;
    }
    if (type === ChartType.Day) {
      //5Min

      const now = new Date(Date.now());
      const lastChartDate = new Date(chartInfo.lastChartDate);
      const updatedAt = new Date(chartInfo.updatedAt);

      const diff = differenceInMinutes(now, lastChartDate);
      if (isOpen) {
        if (diff > 5) {
          return true;
        } else {
          return false;
        }
      } else {
        const isSameDayNowAndUpdateAt =
          getDay(subHours(now, 4)) === getDay(subHours(updatedAt, 4));

        if (isSameDayNowAndUpdateAt) {
          return this.usStockApiService.isIncludeStockMaketTime(now, updatedAt);
        }
        return true;
      }
    } else if (type === ChartType.Week) {
      //30min
      const now = new Date(Date.now());
      const lastChartDate = new Date(chartInfo.lastChartDate);
      const updatedAt = new Date(chartInfo.updatedAt);

      const diff = differenceInMinutes(now, lastChartDate);

      if (this.usStockApiService.isUsStockMarketOpen()) {
        if (diff > 30) {
          return true;
        } else {
          return false;
        }
      } else {
        const isSameDayNowAndUpdateAt =
          getDay(subHours(now, 4)) === getDay(subHours(updatedAt, 4));

        if (isSameDayNowAndUpdateAt) {
          return this.usStockApiService.isIncludeStockMaketTime(now, updatedAt);
        }
        return true;
      }
    } else if (
      type === ChartType.Month ||
      type === ChartType.ThreeMonth ||
      type === ChartType.SixMonth ||
      type === ChartType.Year
    ) {
      const now = new Date(Date.now());
      const lastChartDate = new Date(chartInfo.lastChartDate);
      const updatedAt = new Date(chartInfo.updatedAt);
      const diff = differenceInDays(now, lastChartDate);

      if (diff < 1) {
        return false;
      } else {
        const nowUpdateAtDiff = differenceInDays(now, updatedAt);
        if (nowUpdateAtDiff !== 0) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      throw new BadRequestException();
    }
  }

  async getUsStockData(market: string, type: ChartType, isOpen: boolean) {
    let data;
    if (type === ChartType.Day) {
      const now = utcToZonedTime(Date.now(), nyTimeZone);
      let subtractDay = 1;
      if (isOpen) {
        subtractDay = 0;
      } else {
        const day = now.getDay();
        if (day === 0) {
          subtractDay = 2;
        } else if (day === 1) {
          subtractDay = 3;
        }
      }
      const from = format(subDays(now, subtractDay), dayFormat);
      const to = format(now, dayFormat, {
        timeZone: nyTimeZone,
      });
      data = await this.usStockApiService.getCandlesBy5Min(market, from, to);
    } else if (type === ChartType.Week) {
      const now = utcToZonedTime(Date.now(), nyTimeZone);
      const from = format(subWeeks(now, 1), dayFormat);
      const to = format(now, dayFormat, {
        timeZone: nyTimeZone,
      });

      data = await this.usStockApiService.getCandlesBy30Min(market, from, to);
    } else if (type === ChartType.Month) {
      const now = utcToZonedTime(Date.now(), nyTimeZone);
      const from = format(subMonths(now, 1), dayFormat);
      const to = format(now, dayFormat, {
        timeZone: nyTimeZone,
      });
      data = await this.usStockApiService.getCandlesByDay(market, from, to);
    } else if (type === ChartType.ThreeMonth) {
      const now = utcToZonedTime(Date.now(), nyTimeZone);
      const from = format(subMonths(now, 3), dayFormat);
      const to = format(now, dayFormat, {
        timeZone: nyTimeZone,
      });
      data = await this.usStockApiService.getCandlesByDay(market, from, to);
    } else if (type === ChartType.SixMonth) {
      const now = utcToZonedTime(Date.now(), nyTimeZone);
      const from = format(subMonths(now, 6), dayFormat);
      const to = format(now, dayFormat, {
        timeZone: nyTimeZone,
      });
      data = await this.usStockApiService.getCandlesByDay(market, from, to);
    } else if (type === ChartType.Year) {
      const now = utcToZonedTime(Date.now(), nyTimeZone);
      const from = format(subYears(now, 1), dayFormat);
      const to = format(now, dayFormat, {
        timeZone: nyTimeZone,
      });
      data = await this.usStockApiService.getCandlesByDay(market, from, to);
    } else {
      throw new BadRequestException();
    }
    return data;
  }

  async getKoreaStockChart(stock: Stock, type: ChartType) {
    const key = `${stock.symbol}-${type}`;
    const infoKey = `${stock.symbol}-${type}-info`;
    const chartInfoString = await this.client.getChartInfo(infoKey);
    const chartInfo = plainToClass(ChartInfo, JSON.parse(chartInfoString));
    const status = this.koscomApiService.getKoreaStockMarketStatus();

    if (
      !chartInfoString ||
      this.isInValidKoreaStockData(type, chartInfo, status)
    ) {
      const data = await this.getKoreaStockData(stock, type, status);
      const newChartInfo = new ChartInfo();
      newChartInfo.lastChartDate = format(
        zonedTimeToUtc(data[0].date, krTimeZone),
        hourMinuteFormat,
      );
      newChartInfo.updatedAt = format(Date.now(), hourMinuteFormat);
      await this.client.setChartData(key, data);
      await this.client.setChartInfo(infoKey, JSON.stringify(newChartInfo));
      return data;
    } else {
      const data = await this.client.getChartData(key);
      return data;
    }
  }

  isInValidKoreaStockData(
    type: string,
    chartInfo: ChartInfo,
    status: MarketStatus,
  ) {
    if (!chartInfo) {
      return true;
    }
    if (type === ChartType.Day) {
      //5Min

      const now = new Date(Date.now());
      const lastChartDate = new Date(chartInfo.lastChartDate);
      const updatedAt = new Date(chartInfo.updatedAt);

      const diff = differenceInMinutes(now, lastChartDate);
      if (status === MarketStatus.Open) {
        if (diff > 5) {
          return true;
        } else {
          return false;
        }
      } else {
        const isSameDayNowAndUpdateAt =
          getDay(addHours(now, 9)) === getDay(addHours(updatedAt, 9));

        if (isSameDayNowAndUpdateAt) {
          return this.koscomApiService.isIncludeStockMaketTime(now, updatedAt);
        }
        return true;
      }
    } else if (
      type === ChartType.Week ||
      type === ChartType.Month ||
      type === ChartType.ThreeMonth ||
      type === ChartType.SixMonth ||
      type === ChartType.Year
    ) {
      const now = new Date(Date.now());
      const lastChartDate = new Date(chartInfo.lastChartDate);
      const updatedAt = new Date(chartInfo.updatedAt);
      const diff = differenceInDays(now, lastChartDate);

      if (diff < 1) {
        return false;
      } else {
        const nowUpdateAtDiff = differenceInDays(now, updatedAt);
        if (nowUpdateAtDiff !== 0) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      throw new BadRequestException();
    }
  }

  async getKoreaStockData(stock: Stock, type: ChartType, status: MarketStatus) {
    let data;
    if (type === ChartType.Day) {
      const now = utcToZonedTime(Date.now(), krTimeZone);
      let subtractDay = 1;
      if (status === MarketStatus.Open) {
        subtractDay = 0;
      } else {
        const day = now.getDay();
        if (day === 0) {
          subtractDay = 2;
        } else if (day === 1) {
          if (status === MarketStatus.Pre) {
            subtractDay = 3;
          } else {
            subtractDay = 0;
          }
        }
      }
      const startDay = format(subDays(now, subtractDay), krDayFormat);
      data = await this.koscomApiService.getCandlesBy5Min(stock, startDay);
    } else if (type === ChartType.Week) {
      const now = utcToZonedTime(Date.now(), krTimeZone);
      const from = format(subWeeks(now, 1), krDayFormat);
      const to = format(now, krDayFormat, {
        timeZone: krTimeZone,
      });
      data = await this.koscomApiService.getCandlesByDay(
        stock,
        'D',
        from,
        to,
        7,
      );
    } else if (type === ChartType.Month) {
      const now = utcToZonedTime(Date.now(), krTimeZone);
      const from = format(subMonths(now, 1), krDayFormat);
      const to = format(now, krDayFormat, {
        timeZone: krTimeZone,
      });
      data = await this.koscomApiService.getCandlesByDay(
        stock,
        'D',
        from,
        to,
        30,
      );
    } else if (type === ChartType.ThreeMonth) {
      const now = utcToZonedTime(Date.now(), krTimeZone);
      const from = format(subMonths(now, 3), krDayFormat);
      const to = format(now, krDayFormat, {
        timeZone: krTimeZone,
      });
      data = await this.koscomApiService.getCandlesByDay(
        stock,
        'D',
        from,
        to,
        90,
      );
    } else if (type === ChartType.SixMonth) {
      const now = utcToZonedTime(Date.now(), krTimeZone);
      const from = format(subMonths(now, 6), krDayFormat);
      const to = format(now, krDayFormat, {
        timeZone: krTimeZone,
      });
      data = await this.koscomApiService.getCandlesByDay(
        stock,
        'W',
        from,
        to,
        30,
      );
    } else if (type === ChartType.Year) {
      const now = utcToZonedTime(Date.now(), krTimeZone);
      const from = format(subYears(now, 1), krDayFormat);
      const to = format(now, krDayFormat, {
        timeZone: krTimeZone,
      });
      data = await this.koscomApiService.getCandlesByDay(
        stock,
        'W',
        from,
        to,
        60,
      );
    } else {
      throw new BadRequestException();
    }
    return data;
  }
}
