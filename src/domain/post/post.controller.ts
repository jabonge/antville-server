import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { StockService } from '../stock/stock.service';

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly stockService: StockService,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  create(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.MulterS3.File[],
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postService.createPost(createPostDto, user, files);
  }
}
