import { REDIS_CLIENT } from './constants/index';
import { ConfigService } from '@nestjs/config';
import { PUB_SUB } from './constants/pubsub.constants';
import { Global, Module } from '@nestjs/common';
import redis from 'redis';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { RedisClientWrapper } from './providers/redis-client.service';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_KEY,
    }),
  ],
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
      useClass: RedisClientWrapper,
      inject: [ConfigService],
    },
  ],
  exports: [PUB_SUB, REDIS_CLIENT, JwtModule],
})
export class CommonModule {}
