import { ConfigService } from '@nestjs/config';
import { UploadService } from './../../lib/multer/multer-s3.service';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MulterModule } from '@nestjs/platform-express';
import { UserCount } from './entities/user-count.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserCount]),
    MulterModule.registerAsync({
      useClass: UploadService,
      inject: [ConfigService],
    }),
    NotificationModule,
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
