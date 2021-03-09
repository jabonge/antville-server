import { StockResponse } from './stock-response.dto';
import { CommonResponse } from './../../common/dtos/common-response.dto';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SearchStockResponse extends CommonResponse {
  @Field(() => [StockResponse])
  data: StockResponse[];
}
