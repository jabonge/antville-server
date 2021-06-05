import { StockRepository } from './repositories/stock.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StockRepository])],
  providers: [StockService],
  exports: [StockService],
  controllers: [StockController],
})
export class StockModule {}
