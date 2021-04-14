import { StockPriceInfoDto } from './dtos/stock_price_info.dto';
import { RedisClientWrapper } from '../../common/providers/redis-client.service';
import { StockRepository } from './repositories/stock.repository';
import { Injectable, Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../../util/constant';
import { isKoreanLang } from '../../util/stock';
import { Stock } from './entities/stock.entity';

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

  async getStockByTitle(title: string) {
    let stock: Stock;
    if (isKoreanLang(title)) {
      stock = await this.stockRepository.findByTitle(title);
    } else {
      stock = await this.stockRepository.findBySymbol(title);
    }
    const stockPriceInfo = await this.client.getStockPriceInfo(stock.symbol);
    return {
      stock,
      stockPriceInfo,
    };
  }

  async getStocks(titles: string[]) {
    const stocks = await this.stockRepository.findByTitles(titles);
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
