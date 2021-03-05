import { StockModule } from './../stock/stock.module';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([User]), StockModule],
  providers: [UserResolver, UserService],
  exports: [UserService],
})
export class UserModule {}
