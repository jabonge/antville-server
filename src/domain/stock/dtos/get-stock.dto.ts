import { Stock } from '../entities/stock.entity';
import { StockMetaResponseDto } from './stock-meta-response.dto';

export class GetStockResponseDto {
  stock: Stock;
  stockMeta: StockMetaResponseDto;
}

export class GetStocksResponseDto {
  stocks: Stock[];
  stockMetas: StockMetaResponseDto[];
}
