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
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiTags } from '@nestjs/swagger';

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
  @Get('addWatchList/:id')
  async addWatchList(@CurrentUser() user: User, @Param('id') id: string) {
    const stock = await this.stockService.findById(+id);
    if (!stock) {
      throw new BadRequestException('Stock Not Found');
    }
    await this.userService.addWatchList(stock.id, user.id);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Get('removeWatchList/:id')
  async removeWatchList(@CurrentUser() user: User, @Param('id') id: string) {
    const stock = await this.stockService.findById(+id);
    if (!stock) {
      throw new BadRequestException('Stock Not Found');
    }
    await this.userService.removeWatchList(stock.id, user.id);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Get('follow/:id')
  async followUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userService.followUser(user.id, +id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('unFollow/:id')
  async unFollowUser(@CurrentUser() user: User, @Param('id') id: string) {
    return this.userService.unFollowUser(user.id, +id);
  }
}
