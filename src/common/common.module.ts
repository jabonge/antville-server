import { REDIS_CLIENT } from './constants/index';
import { ConfigService } from '@nestjs/config';
import { PUB_SUB } from './constants/pubsub.constants';
import { Global, Module } from '@nestjs/common';
import redis from 'redis';
import { RedisClientWrapper } from './providers/redis-client.service';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_ACCESS_KEY');
        return {
          secret,
          signOptions: {
            expiresIn: '5h',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'PUB_SUB',
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        return redis.createClient(port, host);
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
