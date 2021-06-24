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
} from '@nestjs/common';
import { CurrentUser } from '../../../infra/decorators/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import {
  ConditionAuthGuard,
  JwtAuthGuard,
} from '../../../infra/guards/auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('sign-up')
  async signUp(@Body() input: CreateUserInput) {
    return this.userService.signUp(input);
  }

  @Get('email-available')
  async emailDuplicateCheck(@Query('email') email: string) {
    return this.userService.emailDuplicateCheck(email);
  }

  @Get('nickname-available')
  async nicknameDuplicateCheck(@Query('nickname') nickname: string) {
    return this.userService.nicknameDuplicateCheck(nickname);
  }

  @Get(':nickname/profile')
  @UseGuards(ConditionAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getUserProfileByNickname(
    @Param('nickname') nickname: string,
    @CurrentUser() me: User,
  ) {
    return this.userService.getUserProfileByNickname(nickname, me?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/follow')
  async followUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userService.followUser(user, +id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  async unFollowUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userService.unFollowUser(user.id, +id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/block')
  async blockUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userService.blockUser(user.id, +id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/block')
  async unBlockUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userService.unBlockUser(user.id, +id);
  }

  @Get(':id/followers')
  async findFollowers(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @Param('id') userId: string,
  ) {
    return this.userService.findFollowers(+userId, +cursor, +limit);
  }

  @Get(':id/following')
  async findFollowing(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @Param('id') userId: string,
  ) {
    return this.userService.findFollowing(+userId, +cursor, +limit);
  }

  @Get('blocking')
  @UseGuards(JwtAuthGuard)
  async findBlocking(
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
    @CurrentUser() me: User,
  ) {
    return this.userService.findBlocking(me.id, +cursor, +limit);
  }

  @Get('search')
  async searchUser(
    @Query('query') query: string,
    @Query('cursor') cursor: string,
    @Query('limit') limit: string,
  ) {
    return this.userService.searchUser(query, +cursor, +limit);
  }

  @Post('profile-img')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('profiles'))
  async updatePropfileImg(
    @CurrentUser() user: User,
    @UploadedFile() profileImg: Express.MulterS3.File,
  ) {
    return this.userService.updateProfileImg(user.id, profileImg);
  }

  @Delete('profile-img')
  @UseGuards(JwtAuthGuard)
  async removePropfileImg(@CurrentUser() user: User) {
    return this.userService.removeProfileImg(user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async editProfile(
    @CurrentUser() user: User,
    @Body() editProfileDto: EditProfileDto,
  ) {
    return this.userService.editProfile(user.id, editProfileDto);
  }

  @Patch('fcm-token')
  @UseGuards(JwtAuthGuard)
  async updateFcmToken(
    @CurrentUser() user: User,
    @Body() { fcmToken }: Record<'fcmToken', string>,
  ) {
    return this.userService.updateFcmToken(user.id, fcmToken);
  }

  @Patch('push-alarm')
  @UseGuards(JwtAuthGuard)
  async changePushAlarm(
    @CurrentUser() user: User,
    @Body() { push }: Record<'push', boolean>,
  ) {
    return this.userService.changePushAlarm(user.id, push);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(user, changePasswordDto);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyEmail(@CurrentUser() user: User) {
    return this.userService.sendVerifyEmail(user);
  }
}
