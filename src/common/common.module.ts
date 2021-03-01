import { REDIS_CLIENT } from './constants/index';
import { ConfigService } from '@nestjs/config';
import { PUB_SUB } from './constants/pubsub.constants';
import { Global, Module } from '@nestjs/common';
import redis from 'redis';
import { RedisPubSub } from 'graphql-redis-subscriptions';

@Global()
@Module({
  providers: [
    {
      provide: PUB_SUB,
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        return new RedisPubSub({
          publisher: redis.createClient(port, host),
          subscriber: redis.createClient(port, host),
        });
      },
      inject: [ConfigService],
    },
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        return redis.createClient(port, host);
      },
      inject: [ConfigService],
    },
  ],
  exports: [PUB_SUB, REDIS_CLIENT],
})
export class CommonModule {}
