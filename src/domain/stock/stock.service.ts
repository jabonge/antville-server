import { StockPriceInfoDto } from './dtos/stock_price_info.dto';
import { RedisClientWrapper } from '../../shared/redis/redis-client.service';
import { StockRepository } from './repositories/stock.repository';
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { REDIS_CLIENT } from '../../util/constant/redis';
import CustomError from '../../util/constant/exception';

@Injectable()
export class StockService {
  constructor(
    private readonly stockRepository: StockRepository,
    @Inject(REDIS_CLIENT) private readonly client: RedisClientWrapper,
  ) {}

  findById(stockId: number) {
    return this.stockRepository.findOne({
      id: stockId,
    });
  }

  findBySymbol(symbol: string) {
    return this.stockRepository.findOneOrFail({
      select: ['type', 'id', 'symbol'],
      where: {
        symbol,
      },
      relations: ['exchange'],
    });
  }

  async search(query: string, cursor: number, limit: number) {
    const stocks = await this.stockRepository.searchStock(query, cursor, limit);
    return stocks;
  }

  async getStockByTag(tag: string) {
    const stock = await this.stockRepository.findByTag(tag);
    if (!stock) {
      throw new BadRequestException(CustomError.INVALID_STOCK);
    }
    const stockPriceInfo = await this.client.getStockPriceInfo(stock.symbol);
    return {
      stock,
      stockPriceInfo,
    };
  }

  async getStocks(tags: string[]) {
    const stocks = await this.stockRepository.findByTags(tags);
    return stocks;
  }

  async getTopDomesticStockList() {
    return await this.stockRepository.getTopDomesticStockList();
  }

  async getTopUsStockList() {
    return await this.stockRepository.getTopUsStockList();
  }

  async getTopCryptoStockList() {
    return await this.stockRepository.getTopCryptoStockList();
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

  async getPrices(symbols: string[]): Promise<StockPriceInfoDto[]> {
    return this.client.getStockPriceInfos(symbols);
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
