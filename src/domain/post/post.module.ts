import { UserModule } from '../user/user.module';
import { PostImg } from './entities/post-img.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PostCount } from './entities/post-count.entity';
import { StockModule } from '../stock/stock.module';
import { PostRepository } from './repositories/post.repository';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostRepository, PostCount, PostImg]),
    StockModule,
    UserModule,
    NotificationModule,
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
