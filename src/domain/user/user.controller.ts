import { EditProfileDto } from './dto/edit-profile.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.dto';
import { StockService } from '../stock/stock.service';
import { UserService } from './user.service';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  BadRequestException,
  Param,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly stockService: StockService,
  ) {}

  @Post('signUp')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() input: CreateUserInput) {
    return this.userService.signUp(input);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/addWatchList')
  async addWatchList(@CurrentUser() user: User, @Param('id') id: string) {
    const stock = await this.stockService.findById(+id);
    if (!stock) {
      throw new BadRequestException('Stock Not Found');
    }
    await this.userService.addWatchList(user.id, stock.id);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/removeWatchList')
  async removeWatchList(@CurrentUser() user: User, @Param('id') id: string) {
    const stock = await this.stockService.findById(+id);
    if (!stock) {
      throw new BadRequestException('Stock Not Found');
    }
    await this.userService.removeWatchList(user.id, stock.id);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/follow')
  async followUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userService.followUser(user.id, +id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/unFollow')
  async unFollowUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userService.unFollowUser(user.id, +id);
  }

  @Get('search')
  async searchUser(query: string, cursor: string, limit: number) {
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
  async editProfile(@CurrentUser() user: User, editProfileDto: EditProfileDto) {
    return this.userService.editProfile(user.id, editProfileDto);
  }
}
