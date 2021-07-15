import { Stock } from './entities/stock.entity';
import { User } from '../user/entities/user.entity';
import { JwtPayloadAuthGuard } from '../../infra/guards/auth.guard';
import { StockResponseDto, StocksResponseDto } from './dtos/stock-response.dto';
import { StockService } from './stock.service';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../infra/decorators/user.decorator';
import { StockPriceInfoDto } from './dtos/stock_price_info.dto';
import { StockPaginationDto } from './dtos/stock-pagination.dto';
import { NotEmptyStringPipe } from '../../infra/pipes/not-empty-string.pipe';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}
  @Post('search')
  search(
    @Body('query', NotEmptyStringPipe) query: string,
    @Query() { page, limit }: StockPaginationDto,
  ): Promise<Stock[]> {
    return this.stockService.search(query, page, limit);
  }

  @UseGuards(JwtPayloadAuthGuard)
  @Get('watchlist')
  getWatchList(@CurrentUser() user: User): Promise<StocksResponseDto> {
    return this.stockService.getWatchListWithStockPriceInfo(user.id);
  }

  @Get('popular')
  getPopularList(): Promise<StocksResponseDto> {
    return this.stockService.getPopularListWithStockPriceInfo();
  }

  @Get('domestic')
  getTopDomesticStockList(): Promise<Stock[]> {
    return this.stockService.getTopDomesticStockList();
  }

  @Get('us')
  getTopUsStockList(): Promise<Stock[]> {
    return this.stockService.getTopUsStockList();
  }

  @Get('crypto')
  getTopCryptoStockList(): Promise<Stock[]> {
    return this.stockService.getTopCryptoStockList();
  }

  @Post('prices')
  getPrices(
    @Body('symbols', new ParseArrayPipe({ items: String, optional: false }))
    symbols: string[],
  ): Promise<StockPriceInfoDto[]> {
    return this.stockService.getPrices(symbols);
  }

  @Get(':tag')
  getStockByTitle(
    @Param('tag', NotEmptyStringPipe) tag: string,
  ): Promise<StockResponseDto> {
    return this.stockService.getStockByTag(tag);
  }
}
