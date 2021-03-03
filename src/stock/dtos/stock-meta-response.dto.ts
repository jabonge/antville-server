import { StockMeta } from '../entities/stock-meta.entity';
import { ObjectType, PickType } from '@nestjs/graphql';

@ObjectType()
export class StockMetaResponse extends PickType(StockMeta, [
  'symbol',
  'latest',
  'dayHigh',
  'dayLow',
  'marketCap',
  'open',
  'previousClose',
  'timestamp',
]) {}
