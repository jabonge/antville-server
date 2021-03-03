import { StockMetaResponse } from '../../stock/dtos/stock-meta-response.dto';
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
    this.client = redis.createClient(port, host);
    this.hgetAsync = promisify(this.client.hget).bind(this.client);
    this.hmgetAsync = promisify(this.client.hmget).bind(this.client);
  }

  async getStockMeta(symbol: string): Promise<StockMetaResponse> {
    const stockMetaString = await this.hgetAsync('stock', symbol);
    const stockMeta = plainToClass(StockMetaResponse, stockMetaString);
    return stockMeta;
  }

  async getStockMetas(symbols: [string]): Promise<StockMetaResponse[]> {
    const stockMetaStrings = await this.hmgetAsync('stock', [symbols]);
    const stockMetas = stockMetaStrings.map((s) => {
      plainToClass(StockMetaResponse, s);
    });
    return stockMetas;
  }
}
