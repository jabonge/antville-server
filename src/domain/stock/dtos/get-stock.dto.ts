import { Stock } from '../entities/stock.entity';
import { StockPriceInfoDto } from './stock_price_info.dto';

export class GetStockResponseDto {
  stock: Stock;
  stockPriceInfo: StockPriceInfoDto;
}

export class GetStocksResponseDto {
  stocks: Stock[];
  stockPriceInfos: StockPriceInfoDto[];
}
