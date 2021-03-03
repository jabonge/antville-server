import { REDIS_CLIENT } from './../common/constants/index';
import { StockRepository } from './repositories/stock.repository';
import { Inject, Injectable } from '@nestjs/common';
import { SearchStockResponse } from './dtos/search-stock.dto';
import { RedisClientWrapper } from '../common/providers/redis-client.service';

@Injectable()
export class StockService {
  constructor(
    private readonly stockRepository: StockRepository,
    @Inject(REDIS_CLIENT) private readonly client: RedisClientWrapper,
  ) {}

  async search(query: string): Promise<SearchStockResponse> {
    const stocks = await this.stockRepository.searchStock(query);
    return {
      ok: true,
      data: stocks,
    };
  }

  async getStock(symbol: string) {
    const stock = await this.stockRepository.findBySymbol(symbol);
    const stockMeta = await this.client.getStockMeta(symbol);
    return {
      stock,
      stockMeta,
    };
  }
}
