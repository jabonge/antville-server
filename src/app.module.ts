import { PostModule } from './domain/post/post.module';
import { AuthModule } from './domain/auth/auth.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockModule } from './domain/stock/stock.module';
import { UserModule } from './domain/user/user.module';
import { AppGateway } from './app.gateway';
import { NotificationModule } from './domain/notification/notification.module';
import { CommentModule } from './domain/comment/comment.module';
import { getEnvFilePath } from './util';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { ChartModule } from './domain/chart/chart.module';

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
    StockModule,
    SharedModule,
    UserModule,
    AuthModule,
    PostModule,
    NotificationModule,
    CommentModule,
    ChartModule,
  ],
  controllers: [],
  providers: [AppGateway],
})
export class AppModule {}
