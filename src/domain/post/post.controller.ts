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
  ParseIntPipe,
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
  JwtPayloadAuthGuard,
} from '../../infra/guards/auth.guard';
import { PaginationParamsDto } from '../../common/dtos/pagination-param.dto';
import { FindOneParamDto } from '../../common/dtos/id-param.dto';

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
    if (user.isBannded) {
      throw new BadRequestException(CustomError.BANNED_USER);
    }
    return this.postService.createPost(createPostDto, user, file);
  }

  @Get(':id/symbol')
  @UseGuards(ConditionAuthGuard)
  findAllPostByStockId(
    @Param() { id }: FindOneParamDto,
    @Query() { cursor, limit }: PaginationParamsDto,
    @CurrentUser() user?: User,
  ) {
    return this.postService.findAllPostByStockId(id, cursor, limit, user?.id);
  }

  @Get()
  @UseGuards(ConditionAuthGuard)
  findOne(@Query('id', ParseIntPipe) id: number, @CurrentUser() user?: User) {
    return this.postService.findOnePost(+id, user?.id);
  }

  @Get('all')
  @UseGuards(ConditionAuthGuard)
  findAllPost(
    @Query() { cursor, limit }: PaginationParamsDto,
    @CurrentUser() user?: User,
  ) {
    return this.postService.findAllPost(cursor, limit, user?.id);
  }

  @Get('watchlist')
  @UseGuards(JwtPayloadAuthGuard)
  findAllPostByWatchList(
    @Query() { cursor, limit }: PaginationParamsDto,
    @CurrentUser() user: User,
  ) {
    return this.postService.findAllPostByWatchList(user.id, cursor, limit);
  }

  @Get('following')
  @UseGuards(JwtPayloadAuthGuard)
  findAllPostByFollowing(
    @Query() { cursor, limit }: PaginationParamsDto,
    @CurrentUser() user: User,
  ) {
    return this.postService.findAllPostByFollowing(user.id, cursor, limit);
  }

  @Get('recommend')
  @UseGuards(JwtPayloadAuthGuard)
  findAllPostByRecommendUser(
    @Query() { cursor, limit }: PaginationParamsDto,
    @CurrentUser() user: User,
  ) {
    return this.postService.findAllPostByRecommendUser(user.id, cursor, limit);
  }

  @Get('popular')
  @UseGuards(ConditionAuthGuard)
  findAllPopularStockPost(
    @Query() { cursor, limit }: PaginationParamsDto,
    @CurrentUser() me?: User,
  ) {
    return this.postService.findAllPopularStockPost(cursor, limit, me?.id);
  }

  @Get(':id/user')
  @UseGuards(ConditionAuthGuard)
  findAllUserPost(
    @Query() { cursor, limit }: PaginationParamsDto,
    @Param() { id }: FindOneParamDto,
    @CurrentUser() me?: User,
  ) {
    return this.postService.findAllUserPost(cursor, limit, id, me?.id);
  }

  @Get(':id/like')
  @UseGuards(ConditionAuthGuard)
  findAllLikedPost(
    @Query() { cursor, limit }: PaginationParamsDto,
    @Param() { id }: FindOneParamDto,
    @CurrentUser() me?: User,
  ) {
    return this.postService.findAllLikedPost(cursor, limit, id, me?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deletePost(@Param() { id }: FindOneParamDto, @CurrentUser() user: User) {
    return this.postService.deletePost(user.id, id);
  }

  @Put(':id/like')
  @UseGuards(JwtAuthGuard)
  likePost(@Param() { id }: FindOneParamDto, @CurrentUser() user: User) {
    return this.postService.likePost(user, id);
  }

  @Delete(':id/like')
  @UseGuards(JwtPayloadAuthGuard)
  unLikePost(@Param() { id }: FindOneParamDto, @CurrentUser() user: User) {
    return this.postService.unLikePost(user.id, id);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  createReport(@Param() { id }: FindOneParamDto, @CurrentUser() user: User) {
    return this.postService.createReport(user.id, id);
  }
}
