import { Stock } from './../entities/stock.entity';
import { ObjectType, PickType } from '@nestjs/graphql';

@ObjectType()
export class StockResponse extends PickType(Stock, [
  'symbol',
  'id',
  'enName',
  'krName',
] as const) {}
