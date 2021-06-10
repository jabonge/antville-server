import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  Get,
  Param,
  Query,
  ClassSerializerInterceptor,
  Delete,
  BadRequestException,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../infra/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import CustomError from '../../util/constant/exception';
import {
  ConditionAuthGuard,
  JwtAuthGuard,
} from '../../infra/guards/auth.guard';

@Controller('post')
@UseInterceptors(ClassSerializerInterceptor)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('posts'))
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.MulterS3.File,
    @Body() createPostDto: CreatePostDto,
  ) {
    if (!user.isEmailVerified) {
      throw new BadRequestException(CustomError.EMAIL_NOT_VERIFIED);
    }
    return this.postService.createPost(createPostDto, user, file);
  }

  @UseGuards(ConditionAuthGuard)
  @Get(':id/symbol')
  findAllPostByStockId(
    @Param('id') id: number,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() user?: User,
  ) {
    return this.postService.findAllPostByStockId(
      +id,
      +cursor,
      +limit,
      user?.id,
    );
  }

  @Get()
  @UseGuards(ConditionAuthGuard)
  findOne(@Query('id') id: string, @CurrentUser() user?: User) {
    return this.postService.findOnePost(+id, user?.id);
  }

  @Get('all')
  @UseGuards(ConditionAuthGuard)
  findAllPost(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() user?: User,
  ) {
    return this.postService.findAllPost(+cursor, +limit, user?.id);
  }

  @Get('watchlist')
  @UseGuards(JwtAuthGuard)
  findAllPostByWatchList(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() user: User,
  ) {
    return this.postService.findAllPostByWatchList(user.id, +cursor, +limit);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  findAllPostByFollowing(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() user: User,
  ) {
    return this.postService.findAllPostByFollowing(user.id, +cursor, +limit);
  }

  @Get('popular')
  @UseGuards(ConditionAuthGuard)
  findAllPopularStockPost(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() me?: User,
  ) {
    return this.postService.findAllPopularStockPost(+cursor, +limit, me?.id);
  }

  @Get(':id/user')
  @UseGuards(ConditionAuthGuard)
  findAllUserPost(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @Param('id') userId: string,
    @CurrentUser() me?: User,
  ) {
    return this.postService.findAllUserPost(+cursor, +limit, +userId, me?.id);
  }

  @Get(':id/like')
  @UseGuards(ConditionAuthGuard)
  findAllLikedPost(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @Param('id') userId: string,
    @CurrentUser() me?: User,
  ) {
    return this.postService.findAllLikedPost(+cursor, +limit, +userId, me?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deletePost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postService.deletePost(user.id, +id);
  }

  @Put(':id/like')
  @UseGuards(JwtAuthGuard)
  likePost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postService.likePost(user, +id);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  unLikePost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postService.unLikePost(user.id, +id);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  createReport(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postService.createReport(user.id, +id);
  }
}
