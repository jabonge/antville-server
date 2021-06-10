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
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../infra/decorators/user.decorator';
import {
  ConditionAuthGuard,
  JwtAuthGuard,
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
    if (!user.isEmailVerified) {
      throw new BadRequestException(CustomError.EMAIL_NOT_VERIFIED);
    }
    return this.commentService.createComment(createCommentDto, user, file);
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

  @Put(':id/like')
  @UseGuards(JwtAuthGuard)
  likeComment(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentService.likeComment(user, +id);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  unLikeComment(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentService.unLikeComment(user.id, +id);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  createCommentReport(@Param('id') id: string, @CurrentUser() user: User) {
    return this.commentService.createReport(user.id, +id);
  }
}
