import { PostModule } from './domain/post/post.module';
import { AuthModule } from './domain/auth/auth.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockModule } from './domain/stock/stock.module';
import { FinancialApiModule } from './lib/financial-api/financial-api.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { UserModule } from './domain/user/user.module';
import { AppGateway } from './app.gateway';
import { NotificationModule } from './domain/notification/notification.module';
import { FcmModule } from './lib/fcm/fcm.module';
import { CommentModule } from './domain/comment/comment.module';
import { UploadService } from './lib/multer/multer-s3.service';
import { MulterModule } from '@nestjs/platform-express';

function getEnvFilePath() {
  const env = process.env.NODE_ENV;
  if (env === 'production') {
    return '.env.production';
  } else if (env === 'development') {
    return '.env.dev';
  } else {
    return '.env.local';
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: getEnvFilePath(),
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: ['dist/**/*.entity{.ts,.js}'],
      logging: process.env.NODE_ENV === 'local',
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    MulterModule.registerAsync({
      useClass: UploadService,
      inject: [ConfigService],
    }),
    FcmModule,
    StockModule,
    FinancialApiModule,
    CommonModule,
    UserModule,
    AuthModule,
    PostModule,
    NotificationModule,
    CommentModule,
  ],
  controllers: [],
  providers: [AppGateway],
})
export class AppModule {}
