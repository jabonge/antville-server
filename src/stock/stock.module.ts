import { StockMetaSubscriber } from './subscribers/stock-meta.subscriber';
import { StockMeta } from './entities/stock-meta.entity';
import { StockRepository } from './repositories/stock.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialApiModule } from '../lib/financial-api/financial-api.module';
import { Module } from '@nestjs/common';
import { StockResolver } from './stock.resolver';
import { StockService } from './stock.service';

@Module({
  imports: [
    FinancialApiModule,
    TypeOrmModule.forFeature([StockRepository, StockMeta]),
  ],
  providers: [StockResolver, StockService, StockMetaSubscriber],
})
export class StockModule {}
