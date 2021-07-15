import { StockPriceInfoDto } from '../../domain/stock/dtos/stock_price_info.dto';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import redis, { ClientOpts, RedisClient } from 'redis';
import { promisify } from 'util';
import { plainToClass, classToPlain } from 'class-transformer';
import { ChartData } from '../../domain/chart/interfaces/chart.interface';

@Injectable()
export class RedisClientWrapper {
  private readonly client: RedisClient;
  private readonly getAsync;
  private readonly mgetAsync;
  private readonly setAsync;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const redisOptions: ClientOpts =
      process.env.NODE_ENV === 'production' ? {} : { password };
    this.client = redis.createClient(port, host, redisOptions);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.mgetAsync = promisify(this.client.mget).bind(this.client);
  }

  async getStockPriceInfo(symbol: string): Promise<StockPriceInfoDto> {
    const stockPriceInfoString = await this.getAsync(symbol);
    const stockPriceInfo = plainToClass(
      StockPriceInfoDto,
      JSON.parse(stockPriceInfoString),
    );
    return stockPriceInfo;
  }

  async getStockPriceInfos(symbols: string[]): Promise<StockPriceInfoDto[]> {
    if (symbols.length <= 0) {
      return [];
    }
    const stockPriceInfoStrings = await this.mgetAsync(symbols);
    const stockPriceInfos: StockPriceInfoDto[] = stockPriceInfoStrings
      .filter((e) => e != null)
      .map((s) => {
        return plainToClass(StockPriceInfoDto, JSON.parse(s));
      });
    return stockPriceInfos;
  }

  getChartInfo(key: string) {
    return this.getAsync(key);
  }

  setChartInfo(key: string, value: string) {
    return this.setAsync(key, value);
  }

  async getChartData(key: string) {
    const chartDataString = await this.getAsync(key);
    if (!chartDataString) {
      return [];
    }
    const chartData: ChartData[] = JSON.parse(chartDataString).map((v) =>
      plainToClass(ChartData, v),
    );
    return chartData;
  }

  setChartData(key: string, data: ChartData[]) {
    return this.setAsync(key, JSON.stringify(classToPlain(data)));
  }
}
