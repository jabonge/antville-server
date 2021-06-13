import { Controller, Query, Post, Body } from '@nestjs/common';
import { ChartService } from './chart.service';

@Controller('chart')
export class ChartController {
  constructor(private readonly chartService: ChartService) {}

  @Post()
  async getChart(
    @Body() { symbol }: Record<'symbol', string>,
    @Query('type') type: string,
  ) {
    return this.chartService.getCryptoChart(symbol, type);
  }
}
