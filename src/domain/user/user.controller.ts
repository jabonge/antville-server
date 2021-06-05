import { ChangeWatchListOrderDto } from './dto/change-watchlist-order.dto';
import { EditProfileDto } from './dto/edit-profile.dto';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.dto';
import { UserService } from './user.service';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Param,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  UploadedFile,
  UseInterceptors,
  Query,
  ClassSerializerInterceptor,
  Patch,
  Delete,
} from '@nestjs/common';
import { CurrentUser } from '../../infra/decorators/user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  ConditionAuthGuard,
  JwtAuthGuard,
} from '../../infra/guards/auth.guard';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signUp')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() input: CreateUserInput) {
    return this.userService.signUp(input);
  }

  @Get('checkEmail')
  async emailDuplicateCheck(@Query('email') email: string) {
    return this.userService.emailDuplicateCheck(email);
  }

  @Get('checkNickname')
  async nicknameDuplicateCheck(@Query('nickname') nickname: string) {
    return this.userService.nicknameDuplicateCheck(nickname);
  }

  @Get(':id/profile')
  @UseGuards(ConditionAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getUserProfile(@Param('id') id: string, @CurrentUser() me: User) {
    return this.userService.getUserProfile(+id, me?.id);
  }

  @Get(':nickname/profileByNickname')
  @UseGuards(ConditionAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getUserProfileByNickname(
    @Param('nickname') nickname: string,
    @CurrentUser() me: User,
  ) {
    return this.userService.getUserProfileByNickname(nickname, me?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/addWatchList')
  async addWatchList(@CurrentUser() user: User, @Param('id') id: string) {
    await this.userService.addWatchList(user.id, +id);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/removeWatchList')
  async removeWatchList(@CurrentUser() user: User, @Param('id') id: string) {
    await this.userService.removeWatchList(user.id, +id);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('removeWatchLists')
  async removeWatchLists(
    @CurrentUser() user: User,
    @Body() { stockIds }: Record<'stockIds', number[]>,
  ) {
    await this.userService.removeWatchLists(user.id, stockIds);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Put('changeWatchListOrder')
  async changeWatchListOrder(
    @CurrentUser() user: User,
    @Body() changeWatchListOrderDto: ChangeWatchListOrderDto,
  ) {
    await this.userService.changeWatchListOrder(
      user.id,
      changeWatchListOrderDto,
    );
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/follow')
  async followUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userService.followUser(user, +id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/unFollow')
  async unFollowUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userService.unFollowUser(user.id, +id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/block')
  async blockUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userService.blockUser(user.id, +id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/unBlock')
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

  @Get('blockingUser')
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

  @Put('updateProfileImg')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('profiles'))
  async updatePropfileImg(
    @CurrentUser() user: User,
    @UploadedFile() profileImg: Express.MulterS3.File,
  ) {
    return this.userService.updateProfileImg(user.id, profileImg);
  }

  @Put('removeProfileImg')
  @UseGuards(JwtAuthGuard)
  async removePropfileImg(@CurrentUser() user: User) {
    return this.userService.removeProfileImg(user.id);
  }

  @Put('editProfile')
  @UseGuards(JwtAuthGuard)
  async editProfile(
    @CurrentUser() user: User,
    @Body() editProfileDto: EditProfileDto,
  ) {
    return this.userService.editProfile(user.id, editProfileDto);
  }

  @Patch('updateFcmToken')
  @UseGuards(JwtAuthGuard)
  async updateFcmToken(
    @CurrentUser() user: User,
    @Body() { fcmToken }: Record<'fcmToken', string>,
  ) {
    return this.userService.updateFcmToken(user.id, fcmToken);
  }

  @Patch('pushOff')
  @UseGuards(JwtAuthGuard)
  async changePushAlarmOff(
    @CurrentUser() user: User,
    @Body() { isOff }: Record<'isOff', boolean>,
  ) {
    return this.userService.changePushAlarmOff(user.id, isOff);
  }

  @Patch('changePassword')
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
