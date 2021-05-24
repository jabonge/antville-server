export interface ICrypto {
  market: string;
  korean_name: string;
  english_name: string;
}

export interface ICryptoMarketCap {
  code: string;
  koreanName: string;
  englishName: string;
  symbol: string;
  currencyCode: CurrencyCode;
  price: number;
  marketCap: number | null;
  accTradePrice24h: number;
  signedChangeRate1h: number;
  signedChangeRate24h: number;
  availableVolume: number;
  provider: Provider;
  lastUpdated: string;
  timestamp: number;
}

export enum CurrencyCode {
  Krw = 'KRW',
}

export enum Provider {
  CoinMarketCap = 'CoinMarketCap',
}
