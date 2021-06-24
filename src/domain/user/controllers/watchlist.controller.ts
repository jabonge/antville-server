import { ChangeWatchListOrderDto } from '../dtos/change-watchlist-order.dto';
import { User } from '../entities/user.entity';
import {
  Body,
  Controller,
  UseGuards,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { CurrentUser } from '../../../infra/decorators/user.decorator';
import { JwtAuthGuard } from '../../../infra/guards/auth.guard';
import { WatchlistService } from '../services/watchlist.service';

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @UseGuards(JwtAuthGuard)
  @Put(':id/add')
  async addWatchList(@CurrentUser() user: User, @Param('id') id: string) {
    await this.watchlistService.addWatchList(user.id, +id);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('ids')
  async removeWatchLists(
    @CurrentUser() user: User,
    @Body() { stockIds }: Record<'stockIds', number[]>,
  ) {
    await this.watchlistService.removeWatchLists(user.id, stockIds);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async removeWatchList(@CurrentUser() user: User, @Param('id') id: string) {
    await this.watchlistService.removeWatchList(user.id, +id);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Put('change')
  async changeWatchListOrder(
    @CurrentUser() user: User,
    @Body() changeWatchListOrderDto: ChangeWatchListOrderDto,
  ) {
    await this.watchlistService.changeWatchListOrder(
      user.id,
      changeWatchListOrderDto,
    );
    return;
  }
}
