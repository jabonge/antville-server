import { Stock } from './../entities/stock.entity';
import { CommonResponse } from './../../common/dtos/common-response.dto';
import { InputType, ObjectType, PickType } from '@nestjs/graphql';

@InputType()
export class GetStockInput extends PickType(
  Stock,
  ['symbol'] as const,
  InputType,
) {}

@ObjectType()
export class GetStockResponse extends CommonResponse(Stock) {}
