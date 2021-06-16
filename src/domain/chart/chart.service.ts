import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  getDay,
  getHours,
  parseISO,
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
        new Date(format(Date.now(), hourMinuteFormat)),
        new Date(chartInfo.lastChartDate),
      );
      console.log(new Date(format(Date.now(), hourMinuteFormat)));
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
    } else if (
      type === ChartType.Month ||
      type == ChartType.ThreeMonth ||
      type === ChartType.SixMonth
    ) {
      const diff = differenceInDays(
        new Date(format(Date.now(), dayFormat)),
        new Date(chartInfo.lastChartDate),
      );
      console.log(new Date(format(Date.now(), dayFormat)));
      console.log(new Date(chartInfo.lastChartDate));
      console.log(diff);
      if (diff < 1) {
        return false;
      }
      return true;
    } else if (type === ChartType.Year) {
      console.log(chartInfo.lastChartDate);
      const diff = differenceInDays(
        new Date(format(Date.now(), dayFormat)),
        new Date(chartInfo.lastChartDate),
      );
      console.log(new Date(format(Date.now(), dayFormat)));
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

  async getUsStockChart(symbol: string, type: string) {
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
    console.log(chartInfo);
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
      console.log(`now: ${now}`);
      console.log(`lastChartDate: ${lastChartDate}`);
      console.log(`updatedAt: ${updatedAt}`);
      console.log(`chartInfo.length: ${chartInfo.length}`);

      const diff = differenceInMinutes(now, lastChartDate);

      console.log(`diff: ${diff}`);
      if (diff < 5) {
        return false;
      } else {
        if (this.isUsStockMarketOpen()) {
          return true;
        } else {
          if (chartInfo.length < 79) {
            return true;
          } else {
            const nowUpdateAtDiff = differenceInDays(now, updatedAt);
            console.log(`nowUpdateAtDiff: ${nowUpdateAtDiff}`);
            if (nowUpdateAtDiff > 0) {
              return true;
            } else {
              return false;
            }
          }
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
      console.log(`now: ${now}`);
      console.log(`lastChartDate: ${lastChartDate}`);
      console.log(`updatedAt: ${updatedAt}`);
      console.log(`chartInfo.length: ${chartInfo.length}`);
      console.log(`diff: ${diff}`);
      if (diff < 30) {
        return false;
      } else {
        if (this.isUsStockMarketOpen()) {
          return true;
        } else {
          if (chartInfo?.length % 14 !== 0) {
            return true;
          } else {
            const nowUpdateAtDiff = differenceInDays(now, updatedAt);
            console.log(`nowUpdateAtDiff: ${nowUpdateAtDiff}`);
            if (nowUpdateAtDiff > 0) {
              return true;
            } else {
              return false;
            }
          }
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
      console.log(now);
      console.log(lastChartDate);
      console.log(updatedAt);
      console.log(diff);
      if (diff < 1) {
        return false;
      } else {
        const nowUpdateAtDiff = differenceInDays(now, updatedAt);
        console.log(nowUpdateAtDiff);
        if (nowUpdateAtDiff > 0) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      throw new BadRequestException();
    }
  }

  async getUsStockData(market: string, type: string) {
    let data;
    if (type === ChartType.Day) {
      const now = utcToZonedTime(Date.now(), nyTimeZone);
      const from = format(subDays(now, 1), dayFormat, {
        timeZone: nyTimeZone,
      });
      const to = format(now, dayFormat, {
        timeZone: nyTimeZone,
      });
      console.log(from);
      console.log(to);
      data = await this.usStockApiService.getCandlesBy5Min(market, from, to);
    } else if (type === ChartType.Week) {
      const now = utcToZonedTime(Date.now(), nyTimeZone);
      const from = format(subWeeks(now, 1), dayFormat);
      const to = format(now, dayFormat, {
        timeZone: nyTimeZone,
      });
      console.log(from);
      console.log(to);
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
    console.log(`stockmaketNow: ${now}`);
    const day = getDay(now);
    console.log(day);
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
}
