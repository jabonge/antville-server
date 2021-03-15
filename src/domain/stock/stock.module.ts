import { StockGateway } from './stock.gateway';
import { StockRepository } from './repositories/stock.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialApiModule } from '../../lib/financial-api/financial-api.module';
import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';

@Module({
  imports: [FinancialApiModule, TypeOrmModule.forFeature([StockRepository])],
  providers: [StockService, StockGateway],
  exports: [StockService],
  controllers: [StockController],
})
export class StockModule {}
