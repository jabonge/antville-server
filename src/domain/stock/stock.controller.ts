import { Stock } from './entities/stock.entity';
import { User } from '../user/entities/user.entity';
import { JwtAuthGuard } from '../../infra/guards/auth.guard';
import { StockResponseDto, StocksResponseDto } from './dtos/stock-response.dto';
import { StockService } from './stock.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../infra/decorators/user.decorator';
import { StockPriceInfoDto } from './dtos/stock_price_info.dto';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}
  @Post('search')
  search(
    @Body() { query }: Record<'query', string>,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ): Promise<Stock[]> {
    return this.stockService.search(query, +page, +limit);
  }

  @UseGuards(JwtAuthGuard)
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
  getPrices(@Body('symbols') symbols: string[]): Promise<StockPriceInfoDto[]> {
    return this.stockService.getPrices(symbols);
  }

  @Get(':tag')
  getStockByTitle(@Param('tag') tag: string): Promise<StockResponseDto> {
    return this.stockService.getStockByTag(tag);
  }
}
