import { LoginResponseDto, LoginInputDto } from './dtos/login.dto';
import { LocalAuthGuard, JwtAuthGuard } from './guards/auth.guard';
import { User } from '../user/entities/user.entity';
import { GetMeResponseDto } from './dtos/get-me.dto';
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: User): GetMeResponseDto {
    return user;
  }
}
