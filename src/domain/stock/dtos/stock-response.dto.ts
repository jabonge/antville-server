import { Stock } from '../entities/stock.entity';
import { StockPriceInfoDto } from './stock_price_info.dto';

export class StockResponseDto {
  stock: Stock;
  stockPriceInfo: StockPriceInfoDto;
}

export class StocksResponseDto {
  stocks: Stock[];
  stockPriceInfos: StockPriceInfoDto[];
}
