import { StockProfile, Quote } from './financial-api.interfaces';
import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FinancialApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    httpService.axiosRef.interceptors.request.use((config) => {
      config.params = {
        ...(config.params || {}),
        apikey: this.configService.get<string>('FINANCIAL_API_KEY'),
      };
      return config;
    });
  }

  async getProfile(symbol: string): Promise<StockProfile> {
    const response = await this.httpService
      .get(`/v3/profile/${symbol}`)
      .toPromise();
    return response.data[0];
  }

  async getQuote(symbol: string): Promise<Quote> {
    const response = await this.httpService
      .get(`/v3/quote/${symbol}`)
      .toPromise();
    return response.data[0];
  }
}
