import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PUB_SUB } from '../util/constant/redis';
import { REDIS_CLIENT } from '../util/constant/redis';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from '../shared/multer/multer-s3.service';
import { RedisClientWrapper } from './redis/redis-client.service';
import { pubsub } from './redis/pub-sub.service';
import { SesService } from './ses/ses.service';

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
            expiresIn: configService.get<string>('JWT_EXPIRE_TIME'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    pubsub,
    {
      provide: REDIS_CLIENT,
      useClass: RedisClientWrapper,
    },
    SesService,
  ],
  exports: [PUB_SUB, REDIS_CLIENT, SesService, JwtModule, MulterModule],
})
export class SharedModule {}
