import { HttpModule, Module } from '@nestjs/common';
import { ChartService } from './chart.service';
import { ChartController } from './chart.controller';
import { UpbitService } from './upbit.service';
import { UsStockApiService } from './us-stock.service';
import { StockModule } from '../stock/stock.module';
import { KoscomApiService } from './koscom.service';

@Module({
  imports: [HttpModule, StockModule],
  providers: [ChartService, UpbitService, UsStockApiService, KoscomApiService],
  controllers: [ChartController],
})
export class ChartModule {}
