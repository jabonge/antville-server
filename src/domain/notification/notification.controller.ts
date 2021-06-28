import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtPayloadAuthGuard } from '../../infra/guards/auth.guard';
import { CurrentUser } from '../../infra/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { PaginationParamsDto } from '../../common/dtos/pagination-param.dto';
import { FindOneParamDto } from '../../common/dtos/id-param.dto';

@Controller('notification')
@UseGuards(JwtPayloadAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAllByUser(
    @CurrentUser() user: User,
    @Query() { cursor, limit }: PaginationParamsDto,
  ) {
    return this.notificationService.findAllByUser(user.id, cursor, limit);
  }

  @Patch(':id')
  async checkNotification(
    @Param() { id }: FindOneParamDto,
    @CurrentUser() user: User,
  ) {
    await this.notificationService.checkNotification(id, user.id);
    return;
  }

  @Delete(':id')
  async remove(@Param() { id }: FindOneParamDto, @CurrentUser() user: User) {
    await this.notificationService.remove(id, user.id);
    return;
  }
}
