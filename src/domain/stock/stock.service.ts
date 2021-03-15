import { StockMetaResponseDto } from './dtos/stock-meta-response.dto';
import { REDIS_CLIENT } from '../../common/constants/index';
import { RedisClientWrapper } from '../../common/providers/redis-client.service';
import { StockRepository } from './repositories/stock.repository';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class StockService {
  constructor(
    private readonly stockRepository: StockRepository,
    @Inject(REDIS_CLIENT) private readonly client: RedisClientWrapper,
  ) {}

  async findById(stockId: number) {
    return this.stockRepository.findOne({
      id: stockId,
    });
  }

  async search(query: string) {
    const stocks = await this.stockRepository.searchStock(query);
    return stocks;
  }

  async getStock(symbol: string) {
    const stock = await this.stockRepository.findBySymbol(symbol);
    const stockMeta = await this.client.getStockMeta(symbol);
    return {
      stock,
      stockMeta,
    };
  }

  async getWatchList(userId: number) {
    const stocks = await this.stockRepository.getWatchList(userId);
    const symbols = stocks.map((v) => v.symbol);
    const stockMetas = (await this.client.getStockMetas(
      symbols,
    )) as StockMetaResponseDto[];

    return {
      stocks,
      stockMetas,
    };
  }
}
