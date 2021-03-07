import { StockRepository } from './repositories/stock.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialApiModule } from '../lib/financial-api/financial-api.module';
import { Module } from '@nestjs/common';
import { StockResolver } from './stock.resolver';
import { StockService } from './stock.service';

@Module({
  imports: [FinancialApiModule, TypeOrmModule.forFeature([StockRepository])],
  providers: [StockResolver, StockService],
  exports: [StockService],
})
export class StockModule {}
