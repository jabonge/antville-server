import moment_timezone from 'moment-timezone';
import moment from 'moment';
import { KoscomApiService, MarketStatus } from './koscom.service';
import { krDayFormat, krTimeZone } from './../../util/constant/time';
import {
  Inject,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { RedisClientWrapper } from '../../shared/redis/redis-client.service';
import { REDIS_CLIENT } from '../../util/constant/redis';
import { ChartInfo } from './interfaces/chart.interface';
import { UpbitService } from './upbit.service';
import { UsStockApiService } from './us-stock.service';
import {
  dayFormat,
  hourMinuteFormat,
  nyTimeZone,
} from '../../util/constant/time';
import { Stock } from '../stock/entities/stock.entity';
import {
  getKoreaMarketStatus,
  isIncludeKoreaIntraDayTime,
  isIncludeUSIntraDayTime,
  isNYSEOpen,
} from '../../util/market';

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
      newChartInfo.lastChartDate = moment(data[0].date)
        .tz(krTimeZone)
        .format(hourMinuteFormat);
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
      const now = moment(moment().format(hourMinuteFormat));
      const diff = now.diff(chartInfo.lastChartDate, 'm');
      if (diff < 5) {
        return false;
      }
      return true;
    } else if (type === ChartType.Week) {
      const now = moment().startOf('h');
      const diff = now.diff(chartInfo.lastChartDate, 'h');
      if (diff < 1) {
        return false;
      }
      return true;
    } else if (
      type === ChartType.Month ||
      type == ChartType.ThreeMonth ||
      type === ChartType.SixMonth
    ) {
      const now = moment(moment().format(dayFormat));
      const lastChartDate = moment(chartInfo.lastChartDate).format(dayFormat);
      const diff = now.diff(lastChartDate, 'd');
      if (diff < 1) {
        return false;
      }
      return true;
    } else if (type === ChartType.Year) {
      const now = moment(moment().format(dayFormat));
      const lastChartDate = moment(chartInfo.lastChartDate).format(dayFormat);
      const diff = now.diff(lastChartDate, 'd');
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
    const isOpen = isNYSEOpen();
    console.log(isOpen);
    if (
      !chartInfoString ||
      this.isInValidUsStockData(type, chartInfo, isOpen)
    ) {
      const data = await this.getUsStockData(symbol, type, isOpen);
      const newChartInfo = new ChartInfo();
      newChartInfo.lastChartDate = moment(data[0].date)
        .tz(nyTimeZone)
        .format(hourMinuteFormat);
      newChartInfo.updatedAt = moment().format(hourMinuteFormat);
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
      const now = moment_timezone().tz(nyTimeZone);
      const lastChartDate = moment_timezone(chartInfo.lastChartDate).tz(
        nyTimeZone,
      );
      const updatedAt = moment_timezone(chartInfo.updatedAt).tz(nyTimeZone);

      const diff = now.diff(lastChartDate, 'm');
      if (isOpen) {
        if (diff > 5) {
          return true;
        } else {
          return false;
        }
      } else {
        const isSameDayNowAndUpdateAt = now.isSame(updatedAt, 'd');

        if (isSameDayNowAndUpdateAt) {
          return isIncludeUSIntraDayTime(now, updatedAt);
        }
        return true;
      }
    } else if (type === ChartType.Week) {
      //30min
      const now = moment_timezone().tz(nyTimeZone);
      const lastChartDate = moment_timezone(chartInfo.lastChartDate).tz(
        nyTimeZone,
      );
      const updatedAt = moment_timezone(chartInfo.updatedAt).tz(nyTimeZone);

      const diff = now.diff(lastChartDate, 'm');

      if (isOpen) {
        if (diff > 30) {
          return true;
        } else {
          return false;
        }
      } else {
        const isSameDayNowAndUpdateAt = now.isSame(updatedAt, 'd');
        if (isSameDayNowAndUpdateAt) {
          return isIncludeUSIntraDayTime(now, updatedAt);
        }
        return true;
      }
    } else if (
      type === ChartType.Month ||
      type === ChartType.ThreeMonth ||
      type === ChartType.SixMonth ||
      type === ChartType.Year
    ) {
      const now = moment();
      const lastChartDate = new Date(chartInfo.lastChartDate);
      const updatedAt = new Date(chartInfo.updatedAt);
      const diff = now.diff(lastChartDate, 'd');

      if (diff < 1) {
        return false;
      } else {
        const isSameDay = now.isSame(updatedAt, 'd');
        if (!isSameDay) {
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
      const now = moment_timezone().tz(nyTimeZone);
      let subtractDay = 1;
      if (isOpen) {
        subtractDay = 0;
      } else {
        const day = now.day();
        if (day === 0) {
          subtractDay = 2;
        } else if (day === 1) {
          subtractDay = 3;
        }
      }
      const from = now.clone().subtract(subtractDay, 'd').format(dayFormat);
      const to = now.format(dayFormat);
      data = await this.usStockApiService.getCandlesBy5Min(market, from, to);
    } else if (type === ChartType.Week) {
      const now = moment_timezone().tz(nyTimeZone);
      const from = now.clone().subtract(1, 'w').format(dayFormat);
      const to = now.format(dayFormat);

      data = await this.usStockApiService.getCandlesBy30Min(market, from, to);
    } else if (type === ChartType.Month) {
      const now = moment_timezone().tz(nyTimeZone);
      const from = now.clone().subtract(1, 'M').format(dayFormat);
      const to = now.format(dayFormat);
      data = await this.usStockApiService.getCandlesByDay(market, from, to);
    } else if (type === ChartType.ThreeMonth) {
      const now = moment_timezone().tz(nyTimeZone);
      const from = now.clone().subtract(3, 'M').format(dayFormat);
      const to = now.format(dayFormat);

      data = await this.usStockApiService.getCandlesByDay(market, from, to);
    } else if (type === ChartType.SixMonth) {
      const now = moment_timezone().tz(nyTimeZone);
      const from = now.clone().subtract(6, 'M').format(dayFormat);
      const to = now.format(dayFormat);

      data = await this.usStockApiService.getCandlesByDay(market, from, to);
    } else if (type === ChartType.Year) {
      const now = moment_timezone().tz(nyTimeZone);
      const from = now.clone().subtract(1, 'y').format(dayFormat);
      const to = now.format(dayFormat);

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
    const status = getKoreaMarketStatus();

    if (
      !chartInfoString ||
      this.isInValidKoreaStockData(type, chartInfo, status)
    ) {
      const data = await this.getKoreaStockData(stock, type, status);
      const newChartInfo = new ChartInfo();
      if (!data[0]?.date) {
        throw new InternalServerErrorException(
          `Chart Error: symbol:${stock.symbol} type: ${type}`,
        );
      }
      newChartInfo.lastChartDate = moment(data[0].date)
        .tz(krTimeZone)
        .format(hourMinuteFormat);

      newChartInfo.updatedAt = moment().format(hourMinuteFormat);
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

      const now = moment_timezone().tz(krTimeZone);
      const lastChartDate = moment_timezone(chartInfo.lastChartDate).tz(
        krTimeZone,
      );
      const updatedAt = moment_timezone(chartInfo.updatedAt).tz(krTimeZone);

      const diff = now.diff(lastChartDate, 'm');
      if (status === MarketStatus.Open) {
        if (diff > 5) {
          return true;
        } else {
          return false;
        }
      } else {
        const isSameDayNowAndUpdateAt = now.isSame(updatedAt, 'd');
        if (isSameDayNowAndUpdateAt) {
          return isIncludeKoreaIntraDayTime(now, updatedAt);
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
      const now = moment();
      const lastChartDate = new Date(chartInfo.lastChartDate);
      const updatedAt = new Date(chartInfo.updatedAt);
      const diff = now.diff(lastChartDate, 'd');

      if (diff < 1) {
        return false;
      } else {
        const nowUpdateAtDiff = now.diff(updatedAt);
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
      const now = moment_timezone().tz(krTimeZone);
      let subtractDay = 1;
      if (status === MarketStatus.Open) {
        subtractDay = 0;
      } else {
        const day = now.day();
        if (day === 0) {
          subtractDay = 2;
        } else if (day === 1) {
          if (status === MarketStatus.Pre) {
            subtractDay = 3;
          } else {
            subtractDay = 0;
          }
        } else if (status === MarketStatus.Post) {
          subtractDay = 0;
        }
      }

      const startDay = now.subtract(subtractDay, 'd').format(krDayFormat);
      data = await this.koscomApiService.getCandlesBy5Min(stock, startDay);
    } else if (type === ChartType.Week) {
      const now = moment_timezone().tz(krTimeZone);
      const from = now.clone().subtract(1, 'w').format(krDayFormat);
      const to = now.clone().format(krDayFormat);
      data = await this.koscomApiService.getCandlesByDay(
        stock,
        'D',
        from,
        to,
        7,
      );
    } else if (type === ChartType.Month) {
      const now = moment_timezone().tz(krTimeZone);
      const from = now.clone().subtract(1, 'M').format(krDayFormat);
      const to = now.format(krDayFormat);
      console.log(from);
      console.log(to);
      data = await this.koscomApiService.getCandlesByDay(
        stock,
        'D',
        from,
        to,
        30,
      );
    } else if (type === ChartType.ThreeMonth) {
      const now = moment_timezone().tz(krTimeZone);
      const from = now.clone().subtract(3, 'M').format(krDayFormat);
      const to = now.format(krDayFormat);

      data = await this.koscomApiService.getCandlesByDay(
        stock,
        'D',
        from,
        to,
        90,
      );
    } else if (type === ChartType.SixMonth) {
      const now = moment_timezone().tz(krTimeZone);
      const from = now.clone().subtract(6, 'M').format(krDayFormat);
      const to = now.format(krDayFormat);
      data = await this.koscomApiService.getCandlesByDay(
        stock,
        'W',
        from,
        to,
        30,
      );
    } else if (type === ChartType.Year) {
      const now = moment_timezone().tz(krTimeZone);
      const from = now.clone().subtract(1, 'y').format(krDayFormat);
      const to = now.format(krDayFormat);
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
