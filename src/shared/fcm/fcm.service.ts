import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { UserService } from '../../domain/user/services/user.service';
import Sentry from '@sentry/node';
import * as admin from 'firebase-admin';
import { CreateNotificationDto } from '../../domain/notification/dto/create-notification.dto';

@Injectable()
export class FcmService {
  constructor(
    @Inject('MESSAGING') private readonly messaging: admin.messaging.Messaging,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async sendNotification(createNotificationDto: CreateNotificationDto) {
    try {
      const users = await this.userService.findFcmTokens([
        createNotificationDto.viewerId,
      ]);
      if (users.length === 0) return;
      const message: admin.messaging.Message = {
        notification: {
          body: createNotificationDto.getContent(),
        },
        data: {
          param: createNotificationDto.param,
          type: createNotificationDto.type,
        },
        token: users[0].fcmToken,
        android: {
          priority: 'high',
        },
      };
      this.messaging.send(message).catch((_) => {
        return;
      });
    } catch (err) {
      Sentry.captureException(err);
    }
  }

  async sendUserNotification(
    receiverIds: number[],
    createNotificationDto: CreateNotificationDto,
  ) {
    try {
      const users = await this.userService.findFcmTokens(receiverIds);
      if (users.length === 0) return;
      const message: admin.messaging.MulticastMessage = {
        notification: {
          body: createNotificationDto.getContent(),
        },
        data: {
          param: createNotificationDto.param,
          type: createNotificationDto.type,
        },
        tokens: users.map((u) => u.fcmToken),
        android: {
          priority: 'high',
        },
      };
      this.messaging.sendMulticast(message).catch((_) => {
        return;
      });
    } catch (err) {
      Sentry.captureException(err);
    }
  }
}
