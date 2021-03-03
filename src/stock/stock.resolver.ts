import { GetStockResponse } from './dtos/get-stock.dto';
import { StockMetaResponse } from './dtos/stock-meta-response.dto';
import { IChangeStockMetaSubscriptionVariables } from './interfaces/change-stock.interface';
import { PubSub } from 'graphql-subscriptions';
import {
  PUB_SUB,
  CHANGE_STOCK_META,
} from './../common/constants/pubsub.constants';
import { StockService } from './stock.service';
import { SearchStockResponse } from './dtos/search-stock.dto';
import { Stock } from './entities/stock.entity';
import { Resolver, Query, Args, Subscription } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';

@Resolver(() => Stock)
export class StockResolver {
  constructor(
    private readonly stockService: StockService,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {}
  @Query(() => SearchStockResponse)
  search(@Args('query') query: string): Promise<SearchStockResponse> {
    return this.stockService.search(query);
  }

  @Query(() => GetStockResponse)
  getStock(@Args('symbol') symbol: string): Promise<GetStockResponse> {
    return this.stockService.getStock(symbol);
  }

  @Subscription(() => StockMetaResponse, {
    filter: (
      payload: StockMetaResponse,
      variables: IChangeStockMetaSubscriptionVariables,
    ) => {
      return variables.symbols.includes(payload.symbol);
    },
    resolve: (value) => {
      return value;
    },
  })
  changeStockMeta(@Args('symbols', { type: () => [String] }) _: [string]) {
    return this.pubsub.asyncIterator(CHANGE_STOCK_META);
  }
}
