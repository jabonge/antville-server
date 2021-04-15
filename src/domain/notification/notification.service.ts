import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { differenceInDays } from 'date-fns';
import { LessThan, Repository, EntityManager } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(
    manager: EntityManager,
    createNotificationDto: CreateNotificationDto,
  ) {
    const notification = createNotificationDto.toNotificationEntity();
    if (
      notification.type === NotificationType.FOLLOW ||
      notification.type === NotificationType.LIKE
    ) {
      const duplicatedNotification = await manager.findOne(Notification, {
        viewerId: notification.viewerId,
        type: notification.type,
        paramId: notification.paramId,
      });
      if (
        duplicatedNotification &&
        differenceInDays(Date.now(), duplicatedNotification.createdAt) < 7
      ) {
        return;
      }
    }
    return manager.save(Notification, notification);
  }

  async createUserTagNotification(
    manager: EntityManager,
    users: User[],
    writer: User,
    postId: number,
    parentId?: number,
  ) {
    const notifications: Notification[] = [];
    for (let i = 0; i < users.length; i++) {
      const createNotificationDto = new CreateNotificationDto();
      createNotificationDto.paramId = parentId ?? postId;
      createNotificationDto.type = NotificationType.TAG;
      createNotificationDto.viewerId = users[i].id;
      createNotificationDto.user = writer;
      notifications.push(createNotificationDto.toNotificationEntity());
    }
    return manager.save(Notification, notifications);
  }

  async createCommentNotification(
    manager: EntityManager,
    author: User,
    viewerId: number,
    parentId: number,
  ) {
    const createNotificationDto = new CreateNotificationDto();
    createNotificationDto.paramId = parentId;
    createNotificationDto.type = NotificationType.COMMENT;
    createNotificationDto.viewerId = viewerId;
    createNotificationDto.user = author;

    return manager.save(
      Notification,
      createNotificationDto.toNotificationEntity(),
    );
  }

  findAllByUser(userId: number, cursor: number, limit: number) {
    const where = { viewerId: userId, id: undefined };
    if (cursor) {
      where.id = LessThan(cursor);
    }
    return this.notificationRepository.find({
      where,
      order: {
        id: 'DESC',
      },
      take: limit,
    });
  }

  checkNotification(id: number, userId: number) {
    return this.notificationRepository.update(
      {
        id: id,
        viewerId: userId,
      },
      {
        isChecked: true,
      },
    );
  }

  remove(id: number, userId: number) {
    return this.notificationRepository.delete({
      id: id,
      viewerId: userId,
    });
  }
}
