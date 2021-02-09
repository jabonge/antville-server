import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { StockModule } from './stock/stock.module';
import { FinancialApiModule } from './lib/financial-api/financial-api.module';
import { ConfigModule } from '@nestjs/config';

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
    GraphQLModule.forRoot({
      playground: process.env.NODE_ENV !== 'production',
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
    StockModule,
    FinancialApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
