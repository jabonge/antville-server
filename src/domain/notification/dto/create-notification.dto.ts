import { User } from '../../user/entities/user.entity';
import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  type: NotificationType;
  param: string;
  content: string;
  viewerId?: number;
  user?: User;

  toNotificationEntity() {
    const notification = new Notification();
    notification.param = this.param;
    notification.viewerId = this.viewerId;
    notification.type = this.type;
    notification.sender = this.user;
    return notification;
  }
}
