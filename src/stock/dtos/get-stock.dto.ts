import { StockResponse } from './stock-response.dto';
import { StockMetaResponse } from './stock-meta-response.dto';
import { Field, ObjectType } from '@nestjs/graphql';

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
