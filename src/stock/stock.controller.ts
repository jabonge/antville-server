import { Stock } from './entities/stock.entity';
import { User } from './../user/entities/user.entity';
import { JwtAuthGuard } from './../auth/guards/auth.guard';
import {
  GetStockResponseDto,
  GetStocksResponseDto,
} from './dtos/get-stock.dto';
import { StockService } from './stock.service';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}
  @Get(':query/search')
  search(@Param('query') query: string): Promise<Stock[]> {
    return this.stockService.search(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('watchList')
  getWatchList(@CurrentUser() user: User): Promise<GetStocksResponseDto> {
    return this.stockService.getWatchList(user.id);
  }

  @Get(':symbol')
  getStock(@Param('symbol') symbol: string): Promise<GetStockResponseDto> {
    return this.stockService.getStock(symbol);
  }
}
