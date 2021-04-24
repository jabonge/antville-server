import { BadRequestException } from '@nestjs/common';
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
    notification.content = this.createContent();
    notification.param = this.param;
    notification.viewerId = this.viewerId;
    notification.type = this.type;
    notification.image = this.user?.profileImg;
    return notification;
  }

  createContent() {
    if (this.content) {
      return this.content;
    } else if (this.user) {
      if (this.type === NotificationType.COMMENT) {
        return `@${this.user.nickname} 님이 회원님의 게시글에 댓글을 남겼습니다.`;
      } else if (this.type === NotificationType.FOLLOW) {
        return `@${this.user.nickname} 님이 회원님을 팔로우 합니다.`;
      } else if (this.type === NotificationType.LIKE) {
        return `@${this.user.nickname} 님이 회원님의 게시글을 좋아합니다.`;
      } else if (this.type == NotificationType.TAG) {
        return `@${this.user.nickname} 님이 게시글에 회원님을 태그하였습니다.`;
      }
    } else {
      throw new BadRequestException();
    }
  }
}
