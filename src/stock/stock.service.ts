import { StockRepository } from './repositories/stock.repository';
import { StockMeta } from './entities/stock-meta.entity';
import { GetStockResponse } from './dtos/get-stock.dto';
import { FinancialApiService } from '../lib/financial-api/financial-api.service';
import { Injectable } from '@nestjs/common';
import { SearchStockResponse } from './dtos/search-stock.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMeta)
    private readonly stockMetaRepository: Repository<StockMeta>,
    private readonly stockRepository: StockRepository,
    private readonly financialApiService: FinancialApiService,
  ) {}

  async search(query: string): Promise<SearchStockResponse> {
    try {
      const stocks = await this.stockRepository.searchStock(query);
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

  async getStock(symbol: string): Promise<GetStockResponse> {
    try {
      const stock = await this.stockRepository.findBySymbol(symbol);
      this.financialApiService.getQuote(symbol).then((quote) => {
        stock.stockMeta.update(quote);
        this.stockMetaRepository.save(stock.stockMeta, { reload: false });
      });
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
