import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import redis, { ClientOpts } from 'redis';
import { PUB_SUB } from '../../util/constant/redis';
import { PubSub } from './interfaces';

export const pubsub: Provider = {
  provide: PUB_SUB,
  useFactory: (configService: ConfigService): PubSub => {
    const host = configService.get<string>('REDIS_HOST');
    const port = configService.get<number>('REDIS_PORT');
    const password = configService.get<string>('REDIS_PASSWORD');
    const redisOptions: ClientOpts =
      process.env.NODE_ENV === 'production' ? {} : { password };
    return {
      publisher: redis.createClient(port, host, redisOptions),
      subscriber: redis.createClient(port, host, redisOptions),
    };
  },
  inject: [ConfigService],
};
