import { Controller, Query, Post, Body } from '@nestjs/common';
import { StockType } from '../stock/entities/stock.entity';
import { StockService } from '../stock/stock.service';
import { ChartService } from './chart.service';

@Controller('chart')
export class ChartController {
  constructor(
    private readonly chartService: ChartService,
    private readonly stockService: StockService,
  ) {}

  @Post()
  async getChart(
    @Body() { symbol }: Record<'symbol', string>,
    @Query('type') type: string,
  ) {
    const stock = await this.stockService.findBySymbol(symbol);
    if (stock.type === StockType.CRYPTO) {
      return this.chartService.getCryptoChart(symbol, type);
    } else if (stock.exchange.countryCode == 'US') {
      return this.chartService.getUsStockChart(symbol, type);
    } else {
      return;
    }
  }
}
