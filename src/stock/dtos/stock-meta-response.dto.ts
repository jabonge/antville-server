import { PickType } from '@nestjs/swagger';
import { StockMeta } from '../entities/stock-meta.entity';

export class StockMetaResponseDto extends PickType(StockMeta, [
  'symbol',
  'latest',
  'dayHigh',
  'dayLow',
  'marketCap',
  'open',
  'previousClose',
  'timestamp',
]) {}
