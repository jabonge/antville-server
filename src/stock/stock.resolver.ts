import { GetStockInput, GetStockResponse } from './dtos/get-stock.dto';
import { StockService } from './stock.service';
import { SearchStockResponse, SearchStockInput } from './dtos/search-stock.dto';
import { Stock } from './entities/stock.entity';
import { Resolver, Query, Args } from '@nestjs/graphql';

@Resolver(() => Stock)
export class StockResolver {
  constructor(private readonly stockService: StockService) {}
  @Query(() => SearchStockResponse)
  search(@Args('input') input: SearchStockInput): SearchStockResponse {
    return this.stockService.search(input);
  }

  @Query(() => GetStockResponse)
  getStock(@Args('input') input: GetStockInput): GetStockResponse {
    return this.stockService.getStock(input);
  }
}
