import { Stock } from './entities/stock.entity';
import { User } from '../user/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import {
  GetStockResponseDto,
  GetStocksResponseDto,
} from './dtos/get-stock.dto';
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
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { StockPriceInfoDto } from './dtos/stock_price_info.dto';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}
  @Get(':query/search')
  search(
    @Param('query') query: string,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
  ): Promise<Stock[]> {
    return this.stockService.search(query, +cursor, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('watchList')
  getWatchList(@CurrentUser() user: User): Promise<GetStocksResponseDto> {
    return this.stockService.getWatchListWithStockPriceInfo(user.id);
  }

  @Get('popular')
  getPopularList(): Promise<GetStocksResponseDto> {
    return this.stockService.getPopularListWithStockPriceInfo();
  }

  @Post('prices')
  getPrices(@Body('symbols') symbols: string[]): Promise<StockPriceInfoDto[]> {
    return this.stockService.getPrices(symbols);
  }

  @Get(':title')
  getStockByTitle(@Param('title') title: string): Promise<GetStockResponseDto> {
    return this.stockService.getStockByTitle(title);
  }
}
