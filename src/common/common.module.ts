import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import redis from 'redis';
import { RedisClientWrapper } from './providers/redis-client.service';
import { JwtModule } from '@nestjs/jwt';
import { PubSub } from './interfaces/pub_sub.interface';
import { PUB_SUB } from '../util/constant/pubsub';
import { REDIS_CLIENT } from '../util/constant';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from '../lib/multer/multer-s3.service';

@Global()
@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: UploadService,
      inject: [ConfigService],
    }),
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
    },
    {
      provide: REDIS_CLIENT,
      useClass: RedisClientWrapper,
      inject: [ConfigService],
    },
  ],
  exports: [PUB_SUB, REDIS_CLIENT, JwtModule, MulterModule],
})
export class CommonModule {}
