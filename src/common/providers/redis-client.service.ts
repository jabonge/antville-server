import { StockPriceInfoDto } from '../../domain/stock/dtos/stock_price_info.dto';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import redis, { RedisClient } from 'redis';
import { promisify } from 'util';
import { plainToClass } from 'class-transformer';

@Injectable()
export class RedisClientWrapper {
  private readonly client: RedisClient;
  private readonly getAsync;
  private readonly mgetAsync;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');
    const password = this.configService.get<string>('REDIS_PASSWORD');
    this.client = redis.createClient(port, host, { password });
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
}
