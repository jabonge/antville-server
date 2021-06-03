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
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/user.decorator';
import CustomError from '../../util/constant/exception';
import { ConditionAuthGuard, JwtAuthGuard } from '../auth/guards/auth.guard';
import { User } from '../user/entities/user.entity';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dtos/create-comment.dto';

@Controller('comment')
@UseInterceptors(ClassSerializerInterceptor)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('create')
  @UseInterceptors(FilesInterceptor('comments'))
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.MulterS3.File[],
    @Body() createCommentDto: CreateCommentDto,
  ) {
    if (!user.isEmailVerified) {
      throw new BadRequestException(CustomError.EMAIL_NOT_VERIFIED);
    }
    return this.commentService.createComment(createCommentDto, user, files);
  }

  @Get(':id/first')
  @UseGuards(ConditionAuthGuard)
  findFirstComments(
    @Param('id') id: string,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() user?: User,
  ) {
    return this.commentService.getFirstComments(+id, +cursor, +limit, user?.id);
  }

  @Get(':id/second')
  @UseGuards(ConditionAuthGuard)
  findSecondComments(
    @Param('id') id: string,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() user?: User,
  ) {
    return this.commentService.getSecondComments(
      +id,
      +cursor,
      +limit,
      user?.id,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteComment(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentService.deleteComment(user.id, +id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  likeComment(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentService.likeComment(user, +id);
  }

  @Post(':id/unLike')
  @UseGuards(JwtAuthGuard)
  unLikeComment(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentService.unLikeComment(user.id, +id);
  }

  @Post(':id/createReport')
  @UseGuards(JwtAuthGuard)
  createCommentReport(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentService.createReport(user.id, +id);
  }
}
