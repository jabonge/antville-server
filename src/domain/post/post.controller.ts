import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Get,
  Param,
  Query,
  ClassSerializerInterceptor,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ConditionAuthGuard, JwtAuthGuard } from '../auth/guards/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { User } from '../user/entities/user.entity';
import { ApiTags } from '@nestjs/swagger';

@Controller('post')
@ApiTags('post')
@UseInterceptors(ClassSerializerInterceptor)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('create')
  @UseInterceptors(FilesInterceptor('posts'))
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.MulterS3.File[],
    @Body() createPostDto: CreatePostDto,
  ) {
    if (!user.isEmailVerified) {
      throw new BadRequestException('Email Not Verified');
    }
    return this.postService.createPost(createPostDto, user, files);
  }

  @UseGuards(ConditionAuthGuard)
  @Get(':id/symbol')
  findAllPostById(
    @Param('id') id: number,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() user?: User,
  ) {
    return this.postService.findAllPostById(+id, +cursor, +limit, user?.id);
  }

  @Get(':id/comment')
  @UseGuards(ConditionAuthGuard)
  findAllComment(
    @Param('id') id: string,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() user?: User,
  ) {
    return this.postService.getComments(+id, +cursor, +limit, user?.id);
  }

  @Get()
  @UseGuards(ConditionAuthGuard)
  findOne(@Query('id') id: string, @CurrentUser() user?: User) {
    return this.postService.findOnePost(+id, user?.id);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  findAllPost(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() user: User,
  ) {
    return this.postService.findAllPost(user.id, +cursor, +limit);
  }

  @Get('watchList')
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

  @Get('user')
  @UseGuards(ConditionAuthGuard)
  findAllUserPost(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @Query('id') userId: string,
    @CurrentUser() me?: User,
  ) {
    return this.postService.findAllUserPost(+cursor, +limit, +userId, me?.id);
  }

  @Get('like')
  @UseGuards(ConditionAuthGuard)
  findAllLikedPost(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @Query('id') userId: string,
    @CurrentUser() me?: User,
  ) {
    return this.postService.findAllLikedPost(+cursor, +limit, +userId, me?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deletePost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postService.deletePost(user.id, +id);
  }

  @Post(':id/likePost')
  @UseGuards(JwtAuthGuard)
  likePost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postService.likePost(user, +id);
  }

  @Post(':id/unLikePost')
  @UseGuards(JwtAuthGuard)
  unLikePost(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postService.unLikePost(user.id, +id);
  }

  @Post(':id/createReport')
  @UseGuards(JwtAuthGuard)
  createReport(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postService.createReport(user.id, +id);
  }
}
