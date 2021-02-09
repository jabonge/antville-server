import { HttpModule, Module } from '@nestjs/common';
import { FinancialApiService } from './financial-api.service';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://financialmodelingprep.com/api',
    }),
  ],
  providers: [FinancialApiService],
  exports: [FinancialApiService],
})
export class FinancialApiModule {}
