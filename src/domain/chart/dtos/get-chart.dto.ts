import { IsNotEmpty, IsString } from 'class-validator';

export class GetChartDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;
}
