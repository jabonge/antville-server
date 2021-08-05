import { PaginationParamsDto } from './../../common/dtos/pagination-param.dto';
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
import { FileInterceptor } from '@nestjs/platform-express';
import { FindOneParamDto } from '../../common/dtos/id-param.dto';
import { CurrentUser } from '../../infra/decorators/user.decorator';
import {
  ConditionAuthGuard,
  JwtAuthGuard,
  JwtPayloadAuthGuard,
} from '../../infra/guards/auth.guard';
import CustomError from '../../util/constant/exception';
import { User } from '../user/entities/user.entity';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dtos/create-comment.dto';

@Controller('comment')
@UseInterceptors(ClassSerializerInterceptor)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('comments'))
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.MulterS3.File,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    if (user.isBannded) {
      throw new BadRequestException(CustomError.BANNED_USER);
    }
    return this.commentService.createComment(createCommentDto, user, file);
  }

  @Get(':id/first')
  @UseGuards(ConditionAuthGuard)
  findFirstComments(
    @Param() { id }: FindOneParamDto,
    @Query() { cursor, limit }: PaginationParamsDto,
    @CurrentUser() user?: User,
  ) {
    return this.commentService.getFirstComments(id, cursor, limit, user?.id);
  }

  @Get(':id/second')
  @UseGuards(ConditionAuthGuard)
  findSecondComments(
    @Param() { id }: FindOneParamDto,
    @Query() { cursor, limit }: PaginationParamsDto,
    @CurrentUser() user?: User,
  ) {
    return this.commentService.getSecondComments(id, cursor, limit, user?.id);
  }

  @Get()
  @UseGuards(ConditionAuthGuard)
  findOne(@Query('id', ParseIntPipe) id: number, @CurrentUser() user?: User) {
    return this.commentService.findOneComment(+id, user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtPayloadAuthGuard)
  deleteComment(@Param() { id }: FindOneParamDto, @CurrentUser() user: User) {
    return this.commentService.deleteComment(user.id, id);
  }

  @Put(':id/like')
  @UseGuards(JwtAuthGuard)
  likeComment(@Param() { id }: FindOneParamDto, @CurrentUser() user: User) {
    return this.commentService.likeComment(user, id);
  }

  @Delete(':id/like')
  @UseGuards(JwtPayloadAuthGuard)
  unLikeComment(@Param() { id }: FindOneParamDto, @CurrentUser() user: User) {
    return this.commentService.unLikeComment(user.id, id);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  createCommentReport(
    @Param() { id }: FindOneParamDto,
    @CurrentUser() user: User,
  ) {
    return this.commentService.createReport(user.id, id);
  }
}
