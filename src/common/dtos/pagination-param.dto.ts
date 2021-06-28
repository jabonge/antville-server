import { Type } from 'class-transformer';
import { Min, Max, IsInt, ValidateIf } from 'class-validator';

export class PaginationParamsDto {
  @ValidateIf((_, value) => {
    return value > 0;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit: number;
}
