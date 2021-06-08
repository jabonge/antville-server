import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import redis from 'redis';
import { PUB_SUB } from '../../util/constant/redis';
import { PubSub } from './interfaces';

export const pubsub: Provider = {
  provide: PUB_SUB,
  useFactory: (configService: ConfigService): PubSub => {
    const host = configService.get<string>('REDIS_HOST');
    const port = configService.get<number>('REDIS_PORT');
    const password = configService.get<string>('REDIS_PASSWORD');
    return {
      publisher: redis.createClient(port, host, { password }),
      subscriber: redis.createClient(port, host, { password }),
    };
  },
  inject: [ConfigService],
};
