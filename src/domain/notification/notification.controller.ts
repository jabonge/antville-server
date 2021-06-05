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
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../infra/guards/auth.guard';
import { CurrentUser } from '../../infra/decorators/user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('notification')
@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAllByUser(
    @CurrentUser() user: User,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
  ) {
    return this.notificationService.findAllByUser(user.id, +cursor, +limit);
  }

  @Patch(':id')
  async checkNotification(@Param('id') id: string, @CurrentUser() user: User) {
    await this.notificationService.checkNotification(+id, user.id);
    return;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.notificationService.remove(+id, user.id);
    return;
  }
}
