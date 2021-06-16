import { HttpModule, Module } from '@nestjs/common';
import { ChartService } from './chart.service';
import { ChartController } from './chart.controller';
import { UpbitService } from './upbit.service';
import { UsStockApiService } from './us-stock.service';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [HttpModule, StockModule],
  providers: [ChartService, UpbitService, UsStockApiService],
  controllers: [ChartController],
})
export class ChartModule {}
