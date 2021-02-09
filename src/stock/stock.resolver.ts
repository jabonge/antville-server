import { PubSub } from 'graphql-subscriptions';
import {
  PUB_SUB,
  CHANGE_STOCK_META,
} from './../common/constants/pubsub.constants';
import { GetStockResponse } from './dtos/get-stock.dto';
import { StockService } from './stock.service';
import { SearchStockResponse } from './dtos/search-stock.dto';
import { Stock } from './entities/stock.entity';
import { Resolver, Query, Args, Subscription, Int } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { StockMeta } from './entities/stock-meta.entity';

@Resolver(() => Stock)
export class StockResolver {
  constructor(
    private readonly stockService: StockService,
    @Inject(PUB_SUB) private readonly pubsub: PubSub,
  ) {}
  @Query(() => SearchStockResponse)
  search(@Args('query') query: string): SearchStockResponse {
    return this.stockService.search(query);
  }

  @Query(() => GetStockResponse)
  getStock(@Args('symbol') symbol: string): GetStockResponse {
    return this.stockService.getStock(symbol);
  }

  @Subscription(() => StockMeta, {
    filter: (payload, variables) => {
      return payload.stockId === variables.id;
    },
    resolve: (value) => {
      return value;
    },
  })
  //eslint-disable-next-line
  changeStockMeta(@Args('id', { type: () => Int }) id: number) {
    return this.pubsub.asyncIterator(CHANGE_STOCK_META);
  }
}
