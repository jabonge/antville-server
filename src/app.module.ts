import { PostModule } from './domain/post/post.module';
import { AuthModule } from './domain/auth/auth.module';
import {
  HttpException,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
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
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { RavenInterceptor, RavenModule } from 'nest-raven';
import { SlackModule } from 'nestjs-slack-webhook';
import { WebhookInterceptor } from './infra/interceptors/slack.interceptor';
import { LoggerMiddleware } from './infra/middlewares/logger.middleware';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import ormConfig from './ormconfig';

@Module({
  imports: [
    RavenModule,
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: getEnvFilePath(),
    }),
    TypeOrmModule.forRoot(ormConfig),
    ThrottlerModule.forRoot({
      ttl: 10,
      limit: 20,
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
  controllers: [AppController],
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
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes('*');
  }
}
