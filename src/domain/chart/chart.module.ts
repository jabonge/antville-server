import { HttpModule, Module } from '@nestjs/common';
import { ChartService } from './chart.service';
import { ChartController } from './chart.controller';
import { UpbitService } from './upbit.service';

@Module({
  imports: [HttpModule],
  providers: [ChartService, UpbitService],
  controllers: [ChartController],
})
export class ChartModule {}
