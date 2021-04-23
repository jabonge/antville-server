import { StockPriceInfoDto } from '../../domain/stock/dtos/stock_price_info.dto';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import redis, { RedisClient } from 'redis';
import { promisify } from 'util';
import { plainToClass } from 'class-transformer';

@Injectable()
export class RedisClientWrapper {
  private readonly client: RedisClient;
  private readonly hgetAsync;
  private readonly hmgetAsync;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');
    const password = this.configService.get<string>('REDIS_PASSWORD');
    this.client = redis.createClient(port, host, { password });
    this.hgetAsync = promisify(this.client.hget).bind(this.client);
    this.hmgetAsync = promisify(this.client.hmget).bind(this.client);
  }

  async getStockPriceInfo(symbol: string): Promise<StockPriceInfoDto> {
    const stockPriceInfoString = await this.hgetAsync('stock', symbol);
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
    const stockPriceInfoStrings = await this.hmgetAsync('stock', symbols);
    const stockPriceInfos: StockPriceInfoDto[] = stockPriceInfoStrings
      .filter((e) => e != null)
      .map((s) => {
        return plainToClass(StockPriceInfoDto, JSON.parse(s));
      });
    console.log(stockPriceInfos);
    return stockPriceInfos;
  }
}
