import { StockMetaResponse } from './stock-meta-response.dto';
import { Stock } from './../entities/stock.entity';
import { Field, ObjectType, PickType } from '@nestjs/graphql';

@ObjectType()
export class StockResponse extends PickType(Stock, [
  'symbol',
  'id',
  'enName',
  'krName',
] as const) {}

@ObjectType()
export class GetStockResponse {
  @Field(() => StockResponse)
  stock: StockResponse;

  @Field(() => StockMetaResponse, { nullable: true })
  stockMeta: StockMetaResponse;
}

@ObjectType()
export class GetStocksResponse {
  @Field(() => [StockResponse])
  stocks: StockResponse[];

  @Field(() => [StockMetaResponse], { nullable: 'items' })
  stockMetas: StockMetaResponse[];
}
