import { StockMetaResponse } from './stock-meta-response.dto';
import { Stock } from './../entities/stock.entity';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GetStockResponse {
  @Field(() => Stock)
  stock: Stock;

  @Field(() => StockMetaResponse, { nullable: true })
  stockMeta: StockMetaResponse;
}

@ObjectType()
export class GetStocksResponse {
  @Field(() => [Stock])
  stocks: Stock[];

  @Field(() => [StockMetaResponse], { nullable: 'items' })
  stockMetas: StockMetaResponse[];
}
