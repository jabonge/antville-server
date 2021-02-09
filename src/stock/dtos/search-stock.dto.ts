import { Stock } from './../entities/stock.entity';
import { CommonResponse } from './../../common/dtos/common-response.dto';
import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';

@InputType()
export class SearchStockInput {
  @Field(() => String)
  query: string;
}

@ObjectType()
export class SearchStockResponse extends CommonResponse(
  PickType(Stock, ['symbol', 'id', 'enName', 'krName']),
  true,
) {}
