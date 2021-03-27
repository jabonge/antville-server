import { StockPriceInfoDto } from './dtos/stock_price_info.dto';
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

  async search(query: string, cursor: number, limit: number) {
    const stocks = await this.stockRepository.searchStock(query, cursor, limit);
    return stocks;
  }

  async getStock(symbol: string) {
    const stock = await this.stockRepository.findBySymbol(symbol);
    const stockPriceInfo = await this.client.getStockPriceInfo(symbol);
    return {
      stock,
      stockPriceInfo,
    };
  }

  async getStocks(symbols: string[]) {
    const stocks = await this.stockRepository.findBySymbols(symbols);
    return stocks;
  }

  async getWatchListWithStockPriceInfo(userId: number) {
    const stocks = await this.getWatchList(userId);
    const symbols = stocks.map((v) => v.symbol);
    const stockPriceInfos = (await this.client.getStockPriceInfos(
      symbols,
    )) as StockPriceInfoDto[];

    return {
      stocks,
      stockPriceInfos,
    };
  }

  async getWatchList(userId: number) {
    return this.stockRepository.getWatchList(userId);
  }

  async getPopularListWithStockPriceInfo() {
    const stocks = await this.stockRepository.getPopularStocks();
    const symbols = stocks.map((v) => v.symbol);
    const stockPriceInfos = (await this.client.getStockPriceInfos(
      symbols,
    )) as StockPriceInfoDto[];
    return {
      stocks,
      stockPriceInfos,
    };
  }
}
