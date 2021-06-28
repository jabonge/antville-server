import { Type } from 'class-transformer';
import { Min, Max, IsInt } from 'class-validator';

export class StockPaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit: number;
}
