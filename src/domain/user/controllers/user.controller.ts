import { EditProfileDto } from '../dtos/edit-profile.dto';
import { User } from '../entities/user.entity';
import { CreateUserInput } from '../dtos/create-user.dto';
import { UserService } from '../services/user.service';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Param,
  Get,
  Put,
  UploadedFile,
  UseInterceptors,
  Query,
  ClassSerializerInterceptor,
  Patch,
  Delete,
  ParseBoolPipe,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from '../../../infra/decorators/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import {
  ConditionAuthGuard,
  JwtAuthGuard,
  JwtPayloadAuthGuard,
} from '../../../infra/guards/auth.guard';
import { FindOneParamDto } from '../../../common/dtos/id-param.dto';
import { PaginationParamsDto } from '../../../common/dtos/pagination-param.dto';
import { NotEmptyStringPipe } from '../../../infra/pipes/not-empty-string.pipe';
import { isEmail } from 'class-validator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('sign-up')
  async signUp(@Body() input: CreateUserInput) {
    return this.userService.signUp(input);
  }

  @Get('email-available')
  async emailDuplicateCheck(@Query('email') email: string) {
    if (!isEmail(email)) {
      throw new BadRequestException('Invalid Email');
    }
    return this.userService.emailDuplicateCheck(email);
  }

  @Get('nickname-available')
  async nicknameDuplicateCheck(
    @Query('nickname', NotEmptyStringPipe) nickname: string,
  ) {
    return this.userService.nicknameDuplicateCheck(nickname);
  }

  @Get(':nickname/profile')
  @UseGuards(ConditionAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getUserProfileByNickname(
    @Param('nickname', NotEmptyStringPipe) nickname: string,
    @CurrentUser() me?: User,
  ) {
    return this.userService.getUserProfileByNickname(nickname, me?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/follow')
  async followUser(
    @CurrentUser() user: User,
    @Param() { id }: FindOneParamDto,
  ) {
    return this.userService.followUser(user, id);
  }

  @UseGuards(JwtPayloadAuthGuard)
  @Delete(':id/follow')
  async unFollowUser(
    @CurrentUser() user: User,
    @Param() { id }: FindOneParamDto,
  ) {
    return this.userService.unFollowUser(user.id, id);
  }

  @UseGuards(JwtPayloadAuthGuard)
  @Put(':id/block')
  async blockUser(@CurrentUser() user: User, @Param() { id }: FindOneParamDto) {
    return this.userService.blockUser(user.id, id);
  }

  @UseGuards(JwtPayloadAuthGuard)
  @Delete(':id/block')
  async unBlockUser(
    @CurrentUser() user: User,
    @Param() { id }: FindOneParamDto,
  ) {
    return this.userService.unBlockUser(user.id, id);
  }

  @Get(':id/followers')
  async findFollowers(
    @Query() { cursor, limit }: PaginationParamsDto,
    @Param() { id }: FindOneParamDto,
  ) {
    return this.userService.findFollowers(id, cursor, limit);
  }

  @Get('recommend')
  async findRecommendUser() {
    return this.userService.findRecommendUser();
  }

  @Get(':id/following')
  async findFollowing(
    @Query() { cursor, limit }: PaginationParamsDto,
    @Param() { id }: FindOneParamDto,
  ) {
    return this.userService.findFollowing(id, cursor, limit);
  }

  @Get('blocking')
  @UseGuards(JwtPayloadAuthGuard)
  async findBlocking(
    @Query() { cursor, limit }: PaginationParamsDto,
    @CurrentUser() me: User,
  ) {
    return this.userService.findBlocking(me.id, cursor, limit);
  }

  @Get('search')
  async searchUser(
    @Query('query', NotEmptyStringPipe) query: string,
    @Query() { cursor, limit }: PaginationParamsDto,
  ) {
    return this.userService.searchUser(query, cursor, limit);
  }

  @Post('profile-img')
  @UseGuards(JwtPayloadAuthGuard)
  @UseInterceptors(FileInterceptor('profiles'))
  async updatePropfileImg(
    @CurrentUser() user: User,
    @UploadedFile() profileImg: Express.MulterS3.File,
  ) {
    return this.userService.updateProfileImg(user.id, profileImg);
  }

  @Delete('profile-img')
  @UseGuards(JwtPayloadAuthGuard)
  async removePropfileImg(@CurrentUser() user: User) {
    return this.userService.removeProfileImg(user.id);
  }

  @Put('profile')
  @UseGuards(JwtPayloadAuthGuard)
  async editProfile(
    @CurrentUser() user: User,
    @Body() editProfileDto: EditProfileDto,
  ) {
    return this.userService.editProfile(user.id, editProfileDto);
  }

  @Patch('fcm-token')
  @UseGuards(JwtPayloadAuthGuard)
  async updateFcmToken(
    @CurrentUser() user: User,
    @Body('fcmToken', NotEmptyStringPipe) fcmToken: string,
  ) {
    return this.userService.updateFcmToken(user.id, fcmToken);
  }

  @Patch('push-alarm')
  @UseGuards(JwtPayloadAuthGuard)
  async changePushAlarm(
    @CurrentUser() user: User,
    @Body('push', ParseBoolPipe) push: boolean,
  ) {
    return this.userService.changePushAlarm(user.id, push);
  }

  @Patch('change-password')
  @UseGuards(JwtPayloadAuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(user.id, changePasswordDto);
  }

  @Post('verify')
  @UseGuards(JwtPayloadAuthGuard)
  async verifyEmail(@CurrentUser() user: User) {
    return this.userService.sendVerifyEmail(user);
  }
}
