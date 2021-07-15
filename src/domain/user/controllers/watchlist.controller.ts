import { ChangeWatchListOrderDto } from '../dtos/change-watchlist-order.dto';
import { User } from '../entities/user.entity';
import {
  Body,
  Controller,
  UseGuards,
  Param,
  Put,
  Delete,
  ParseArrayPipe,
} from '@nestjs/common';
import { CurrentUser } from '../../../infra/decorators/user.decorator';
import { JwtPayloadAuthGuard } from '../../../infra/guards/auth.guard';
import { WatchlistService } from '../services/watchlist.service';
import { FindOneParamDto } from '../../../common/dtos/id-param.dto';

@Controller('watchlist')
@UseGuards(JwtPayloadAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Put(':id/add')
  async addWatchList(
    @CurrentUser() user: User,
    @Param() { id }: FindOneParamDto,
  ) {
    await this.watchlistService.addWatchList(user.id, id);
    return;
  }

  @Delete('ids')
  async removeWatchLists(
    @CurrentUser() user: User,
    @Body('stockIds', new ParseArrayPipe({ items: Number }))
    stockIds: number[],
  ) {
    await this.watchlistService.removeWatchLists(user.id, stockIds);
    return;
  }

  @Delete(':id')
  async removeWatchList(
    @CurrentUser() user: User,
    @Param() { id }: FindOneParamDto,
  ) {
    await this.watchlistService.removeWatchList(user.id, id);
    return;
  }

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
