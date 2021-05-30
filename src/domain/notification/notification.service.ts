import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { FcmService } from '../../lib/fcm/fcm.service';
import { User } from '../user/entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly fcmService: FcmService,
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
        senderId: notification.sender.id,
        type: notification.type,
        param: notification.param,
      });
      if (duplicatedNotification) {
        return;
      }
    }
    this.fcmService.sendNotification(createNotificationDto);
    return manager.save(Notification, notification);
  }

  async likeNotification(
    manager: EntityManager,
    user: User,
    param: number,
    viewerId: number,
  ) {
    const createNotificationDto = new CreateNotificationDto();
    createNotificationDto.param = `${param}`;
    createNotificationDto.type = NotificationType.LIKE;
    createNotificationDto.user = user;
    createNotificationDto.viewerId = viewerId;
    await this.create(manager, createNotificationDto);
  }

  async createUserTagNotification(
    manager: EntityManager,
    users: User[],
    writer: User,
    postId: number,
  ) {
    const createNotificationDtos: CreateNotificationDto[] = [];
    for (let i = 0; i < users.length; i++) {
      const createNotificationDto = new CreateNotificationDto();
      createNotificationDto.param = `${postId}`;
      createNotificationDto.type = NotificationType.TAG;
      createNotificationDto.viewerId = users[i].id;
      createNotificationDto.user = writer;
      createNotificationDtos.push(createNotificationDto);
    }
    this.fcmService.sendUserTagNotification(
      users.map((u) => u.id),
      createNotificationDtos[0],
    );
    return manager.save(
      Notification,
      createNotificationDtos.map((c) => c.toNotificationEntity()),
    );
  }

  findAllByUser(userId: number, cursor: number, limit: number) {
    const query = this.notificationRepository
      .createQueryBuilder('n')
      .where(`n.viewerId = ${userId}`)
      .leftJoin('n.sender', 'sender')
      .addSelect(['sender.id', 'sender.nickname', 'sender.profileImg'])
      .orderBy('n.id', 'DESC')
      .limit(limit);
    if (cursor) {
      query.andWhere('n.id < :cursor', { cursor });
    }
    return query.getMany();
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
