import { UserModule } from './../user/user.module';
import { PostLink } from './entities/link.entity';
import { PostImg } from './entities/post-img.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadService } from './../../lib/multer/multer-s3.service';
import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { MulterModule } from '@nestjs/platform-express';
import { PostCount } from './entities/post-count.entity';
import { StockModule } from '../stock/stock.module';
import { ConfigService } from '@nestjs/config';
import { PostRepository } from './repositories/post.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostRepository, PostCount, PostImg, PostLink]),
    MulterModule.registerAsync({
      useClass: UploadService,
      inject: [ConfigService],
    }),
    StockModule,
    UserModule,
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
