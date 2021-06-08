import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { MulterModule } from '@nestjs/platform-express';
import { UserCount } from './entities/user-count.entity';
import { NotificationModule } from '../notification/notification.module';
import { Watchlist } from './entities/watchlist.entity';
import { WatchlistService } from './services/watchlist.service';
import { WatchlistController } from './controllers/watchlist.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserCount, Watchlist]),
    MulterModule,
    NotificationModule,
  ],
  providers: [UserService, WatchlistService],
  exports: [UserService],
  controllers: [UserController, WatchlistController],
})
export class UserModule {}
