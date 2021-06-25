import { PostModule } from './domain/post/post.module';
import { AuthModule } from './domain/auth/auth.module';
import { HttpException, MiddlewareConsumer, Module } from '@nestjs/common';
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
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RavenInterceptor, RavenModule } from 'nest-raven';
import { SlackModule } from 'nestjs-slack-webhook';
import { WebhookInterceptor } from './infra/interceptors/slack.interceptor';
import { LoggerMiddleware } from './infra/middlewares/logger.middleware';

@Module({
  imports: [
    RavenModule,
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
    SlackModule.forRoot({
      url: process.env.SLACK_WEBHOOK_URL,
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
  providers: [
    AppGateway,
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor({
        filters: [
          {
            type: HttpException,
            filter: (exception: HttpException) => {
              return 500 > exception.getStatus();
            },
          },
        ],
      }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: WebhookInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
