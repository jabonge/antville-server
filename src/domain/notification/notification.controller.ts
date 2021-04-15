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
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
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
  checkNotification(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationService.checkNotification(+id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationService.remove(+id, user.id);
  }
}
