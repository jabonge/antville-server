import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ChartType } from '../chart.service';

export class ChartTypeQueryDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(ChartType)
  type: ChartType;
}
