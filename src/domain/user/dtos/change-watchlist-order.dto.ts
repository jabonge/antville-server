import { IsEnum, IsInt } from 'class-validator';
export enum ChangeType {
  LAST = 'LAST',
  FIRST = 'FIRST',
  BETWEEN = 'BETWEEN',
}

export class ChangeWatchListOrderDto {
  @IsInt()
  stockId: number;
  @IsInt({ each: true })
  betweenStockIds: number[];
  @IsEnum(ChangeType)
  type: ChangeType;
}
