import { krTimeZone } from './../../util/constant/time';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import {
  differenceInDays,
  differenceInMinutes,
  getDay,
  getHours,
  parseISO,
  startOfDay,
  startOfHour,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { RedisClientWrapper } from '../../shared/redis/redis-client.service';
import { REDIS_CLIENT } from '../../util/constant/redis';
import { ChartInfo } from './interfaces/chart.interface';
import { UpbitService } from './upbit.service';
import { format, utcToZonedTime } from 'date-fns-tz';
import { UsStockApiService } from './us-stock.service';
import {
  dayFormat,
  hourMinuteFormat,
  nyTimeZone,
} from '../../util/constant/time';
import differenceInHours from 'date-fns/differenceInHours';

export enum ChartType {
  Day = '1d',
  Week = '1w',
  Month = '1m',
  ThreeMonth = '3m',
  SixMonth = '6m',
  Year = '1y',
}

@Injectable()
export class ChartService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly client: RedisClientWrapper,
    private readonly upbitService: UpbitService,
    private readonly usStockApiService: UsStockApiService,
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
      const now = new Date(
        format(utcToZonedTime(Date.now(), krTimeZone), hourMinuteFormat),
      );
      const lastChartDate = new Date(
        format(parseISO(chartInfo.lastChartDate), hourMinuteFormat, {
          timeZone: krTimeZone,
        }),
      );
      const diff = differenceInMinutes(now, lastChartDate);
      if (diff < 5) {
        return false;
      }
      return true;
    } else if (type === ChartType.Week) {
      const now = new Date(
        format(
          utcToZonedTime(startOfHour(Date.now()), krTimeZone),
          hourMinuteFormat,
        ),
      );
      const lastChartDate = new Date(
        format(parseISO(chartInfo.lastChartDate), hourMinuteFormat, {
          timeZone: krTimeZone,
        }),
      );
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
      const now = new Date(
        format(utcToZonedTime(Date.now(), krTimeZone), dayFormat),
      );
      const lastChartDate = new Date(
        format(parseISO(chartInfo.lastChartDate), dayFormat, {
          timeZone: krTimeZone,
        }),
      );
      const diff = differenceInDays(now, lastChartDate);
      if (diff < 1) {
        return false;
      }
      return true;
    } else if (type === ChartType.Year) {
      const now = new Date(
        format(utcToZonedTime(Date.now(), krTimeZone), dayFormat),
      );
      const lastChartDate = new Date(
        format(parseISO(chartInfo.lastChartDate), dayFormat, {
          timeZone: krTimeZone,
        }),
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

    if (!chartInfoString || this.isInValidUsStockData(type, chartInfo)) {
      const data = await this.getUsStockData(symbol, type);
      const newChartInfo = new ChartInfo();
      newChartInfo.length = data.length;
      newChartInfo.lastChartDate = data[0].date;
      newChartInfo.updatedAt = format(
        utcToZonedTime(Date.now(), nyTimeZone),
        hourMinuteFormat,
        {
          timeZone: nyTimeZone,
        },
      );
      await this.client.setChartData(key, data);
      await this.client.setChartInfo(infoKey, JSON.stringify(newChartInfo));
      return data;
    } else {
      const data = await this.client.getChartData(key);
      return data;
    }
  }

  isInValidUsStockData(type: string, chartInfo: ChartInfo) {
    if (!chartInfo) {
      return true;
    }
    if (type === ChartType.Day) {
      //5Min
      const now = new Date(
        format(utcToZonedTime(Date.now(), nyTimeZone), hourMinuteFormat),
      );
      const lastChartDate = new Date(
        format(parseISO(chartInfo.lastChartDate), hourMinuteFormat, {
          timeZone: nyTimeZone,
        }),
      );
      const updatedAt = new Date(
        format(parseISO(chartInfo.updatedAt), hourMinuteFormat, {
          timeZone: nyTimeZone,
        }),
      );

      const diff = differenceInMinutes(now, lastChartDate);

      if (this.isUsStockMarketOpen()) {
        if (diff > 5) {
          return true;
        } else {
          return false;
        }
      } else {
        if (chartInfo.length < 79) {
          return true;
        } else {
          const isSameDayNowAndUpdateAt =
            differenceInDays(startOfDay(now), startOfDay(updatedAt)) === 0;
          if (isSameDayNowAndUpdateAt) {
            return this.isIncludeStockMaketTime(now, updatedAt);
          }
          return true;
        }
      }
    } else if (type === ChartType.Week) {
      //30min
      const now = new Date(
        format(utcToZonedTime(Date.now(), nyTimeZone), hourMinuteFormat),
      );
      const lastChartDate = new Date(
        format(parseISO(chartInfo.lastChartDate), hourMinuteFormat, {
          timeZone: nyTimeZone,
        }),
      );
      const updatedAt = new Date(
        format(parseISO(chartInfo.updatedAt), hourMinuteFormat, {
          timeZone: nyTimeZone,
        }),
      );

      const diff = differenceInMinutes(now, lastChartDate);

      if (this.isUsStockMarketOpen()) {
        if (diff > 30) {
          return true;
        } else {
          return false;
        }
      } else {
        if (chartInfo.length % 14 !== 0) {
          return true;
        } else {
          const isSameDayNowAndUpdateAt =
            differenceInMinutes(startOfDay(now), startOfDay(updatedAt)) === 0;
          if (isSameDayNowAndUpdateAt) {
            return this.isIncludeStockMaketTime(now, updatedAt);
          }
          return true;
        }
      }
    } else if (
      type === ChartType.Month ||
      type === ChartType.ThreeMonth ||
      type === ChartType.SixMonth ||
      type === ChartType.Year
    ) {
      const now = new Date(
        format(utcToZonedTime(Date.now(), nyTimeZone), dayFormat, {
          timeZone: nyTimeZone,
        }),
      );
      const lastChartDate = new Date(
        format(parseISO(chartInfo.lastChartDate), dayFormat, {
          timeZone: nyTimeZone,
        }),
      );
      const updatedAt = new Date(
        format(parseISO(chartInfo.updatedAt), dayFormat, {
          timeZone: nyTimeZone,
        }),
      );
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

  async getUsStockData(market: string, type: ChartType) {
    let data;
    if (type === ChartType.Day) {
      const now = utcToZonedTime(Date.now(), nyTimeZone);
      const from = format(subDays(now, 1), dayFormat, {
        timeZone: nyTimeZone,
      });
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

  isUsStockMarketOpen() {
    const now = utcToZonedTime(Date.now(), nyTimeZone);
    const day = getDay(now);
    if (day === 0 || day === 6) {
      return false;
    } else {
      const hour = getHours(now);
      if (hour < 9 || hour > 16) {
        return false;
      }
      return true;
    }
  }

  isIncludeStockMaketTime(now: Date, updatedAt: Date) {
    const day = getDay(now);
    if (day === 0 || day === 6) {
      return false;
    } else {
      const nowHour = getHours(now);
      const updateAtHour = getHours(updatedAt);
      const diffTime = differenceInMinutes(now, updatedAt);
      if (updateAtHour < 9 || nowHour > 16) {
        if (diffTime > 390) {
          return true;
        }
      }
      return false;
    }
  }
}
