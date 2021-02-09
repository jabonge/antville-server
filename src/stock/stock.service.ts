import { StockRepository } from './repositories/stock.repository';
import { StockMeta } from './entities/stock-meta.entity';
import { GetStockInput, GetStockResponse } from './dtos/get-stock.dto';
import { Stock } from './entities/stock.entity';
import { FinancialApiService } from '../lib/financial-api/financial-api.service';
import { Injectable } from '@nestjs/common';
import { SearchStockInput, SearchStockResponse } from './dtos/search-stock.dto';

@Injectable()
export class StockService {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly financialApiService: FinancialApiService,
  ) {}

  async search(input: SearchStockInput): Promise<SearchStockResponse> {
    try {
      const stocks = await this.stockRepository
        .createQueryBuilder()
        .select()
        .where(`MATCH(symbol) AGAINST ('+${input.query}' IN BOOLEAN MODE)`)
        .orWhere(
          `MATCH(enName,krName) AGAINST ('*${input.query}* *${input.query}*' IN BOOLEAN MODE)`,
        )
        .getMany();
      return {
        ok: true,
        data: stocks,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async getStock({ symbol }: GetStockInput): Promise<GetStockResponse> {
    try {
      let stock = await this.stockRepository.findBySymbol(symbol);
      if (!stock) {
        const profile = await this.financialApiService.getProfile(symbol);
        stock = new Stock();
        stock.symbol = profile.symbol;
        stock.sector = profile.sector;
        stock.ipoDate = new Date(profile.ipoDate);
        stock.enName = profile.companyName;
      }
      const quote = await this.financialApiService.getQuote(symbol);
      const stockMeta = new StockMeta();
      stockMeta.marketCap = quote.marketCap;
      stock.stockMeta = stockMeta;
      await this.stockRepository.save(stock);
      return {
        ok: true,
        data: stock,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }
}
