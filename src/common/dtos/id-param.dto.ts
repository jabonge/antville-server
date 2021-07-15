import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class FindOneParamDto {
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  id: number;
}
