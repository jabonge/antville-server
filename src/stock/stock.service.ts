import { StockRepository } from './repositories/stock.repository';
import { Injectable } from '@nestjs/common';
import { SearchStockResponse } from './dtos/search-stock.dto';

@Injectable()
export class StockService {
  constructor(private readonly stockRepository: StockRepository) {}

  async search(query: string): Promise<SearchStockResponse> {
    const stocks = await this.stockRepository.searchStock(query);
    return {
      ok: true,
      data: stocks,
    };
  }
}
