import { PostModule } from './domain/post/post.module';
import { AuthModule } from './domain/auth/auth.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockModule } from './domain/stock/stock.module';
import { FinancialApiModule } from './lib/financial-api/financial-api.module';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { UserModule } from './domain/user/user.module';
import { AppGateway } from './app.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      envFilePath: '.env.dev',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: ['dist/**/*.entity{.ts,.js}'],
      logging: process.env.NODE_ENV !== 'production',
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    StockModule,
    FinancialApiModule,
    CommonModule,
    UserModule,
    AuthModule,
    PostModule,
  ],
  controllers: [],
  providers: [AppGateway],
})
export class AppModule {}
