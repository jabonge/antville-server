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
  @Post('search')
  search(
    @Body() { query }: Record<'query', string>,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ): Promise<Stock[]> {
    return this.stockService.search(query, +page, +limit);
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

  @Get(':tag')
  getStockByTitle(@Param('tag') tag: string): Promise<GetStockResponseDto> {
    return this.stockService.getStockByTag(tag);
  }
}
