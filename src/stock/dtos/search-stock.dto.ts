import { Stock } from './../entities/stock.entity';
import { CommonResponse } from './../../common/dtos/common-response.dto';
import { ObjectType, PickType, Field } from '@nestjs/graphql';

@ObjectType()
class SearchStock extends PickType(Stock, [
  'symbol',
  'id',
  'enName',
  'krName',
] as const) {}

@ObjectType()
export class SearchStockResponse extends CommonResponse {
  @Field(() => [SearchStock])
  data: SearchStock[];
}
