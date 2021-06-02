import { LoginResponseDto, LoginInputDto } from './dtos/login.dto';
import { LocalAuthGuard, JwtAuthGuard } from './guards/auth.guard';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('refresh')
  reIssueAccessToken(@Body() { refreshToken }: { refreshToken: string }) {
    const token = this.authService.reIssueAccessToken(refreshToken);
    return {
      token,
    };
  }
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @CurrentUser() user: User,
    @Body() _: LoginInputDto,
  ): Promise<LoginResponseDto> {
    return this.authService.login(user);
  }

  @Post('findPassword')
  async findPassword(@Body('email') email: string) {
    return this.authService.findPassword(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: User): Promise<User> {
    return this.authService.getMe(user);
  }
}
