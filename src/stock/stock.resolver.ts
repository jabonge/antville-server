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
import { StockMeta } from './entities/stock-meta.entity';

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

  @Subscription(() => StockMeta, {
    filter: (
      payload: StockMeta,
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
