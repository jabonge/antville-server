import { User } from './../user/entities/user.entity';
import {
  JwtGqlAuthGuard,
  JwtGqlWsAuthGuard,
} from './../auth/guards/auth.guard';
import { GetStockResponse, GetStocksResponse } from './dtos/get-stock.dto';
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
import { Inject, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/user.decorator';

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

  @Query(() => GetStocksResponse)
  @UseGuards(JwtGqlAuthGuard)
  getWatchList(@CurrentUser() user: User): Promise<GetStocksResponse> {
    return this.stockService.getWatchList(user.id);
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
  @UseGuards(JwtGqlWsAuthGuard)
  changeStockMeta(@Args('symbols', { type: () => [String] }) _: [string]) {
    return this.pubsub.asyncIterator(CHANGE_STOCK_META);
  }
}
