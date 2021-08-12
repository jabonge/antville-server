import { Controller, Query, Post, Body } from '@nestjs/common';
import { StockType } from '../stock/entities/stock.entity';
import { StockService } from '../stock/stock.service';
import { ChartService } from './chart.service';
import { ChartTypeQueryDto } from './dtos/chart-type.dto';
import { GetChartDto } from './dtos/get-chart.dto';

@Controller('chart')
export class ChartController {
  constructor(
    private readonly chartService: ChartService,
    private readonly stockService: StockService,
  ) {}

  @Post()
  async getChart(
    @Body() { symbol }: GetChartDto,
    @Query() { type }: ChartTypeQueryDto,
  ) {
    const stock = await this.stockService.findBySymbol(symbol);
    if (stock.type === StockType.CRYPTO) {
      return this.chartService.getCryptoChart(symbol, type);
    } else if (stock.exchange.countryCode == 'US') {
      return this.chartService.getUsStockChart(symbol, type);
    } else {
      return this.chartService.getKoreaStockChart(stock, type);
    }
  }
}
