import { BadRequestException } from '@nestjs/common';
import { User } from '../../user/entities/user.entity';
import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  type: NotificationType;
  param: string;
  webParam?: number;
  content: string;
  viewerId?: number;
  user?: User;

  toNotificationEntity() {
    const notification = new Notification();
    notification.param = this.param;
    notification.viewerId = this.viewerId;
    notification.webParam = this.webParam ? `${this.webParam}` : undefined;
    notification.type = this.type;
    notification.sender = this.user;
    return notification;
  }

  getContent() {
    if (
      this.type === NotificationType.LIKE ||
      this.type === NotificationType.COMMENT_LIKE
    ) {
      return `${this.user.nickname} 님이 회원님의 글을 좋아합니다.`;
    } else if (this.type === NotificationType.FOLLOW) {
      return `${this.user.nickname} 님이 회원님을 팔로우 합니다.`;
    } else if (
      this.type === NotificationType.TAG ||
      this.type === NotificationType.COMMENT_TAG
    ) {
      return `${this.user.nickname} 님이 게시글에 회원님을 태그하였습니다.`;
    } else if (this.type === NotificationType.POST_COMMENT) {
      return `${this.user.nickname} 님이 게시글에 댓글을 남겼습니다.`;
    } else if (this.type === NotificationType.COMMENT_COMMENT) {
      return `${this.user.nickname} 님이 대댓글을 남겼습니다.`;
    } else {
      throw new BadRequestException('Unexpected Type');
    }
  }
}
