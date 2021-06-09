import { LoginResponseDto, LoginInputDto } from './dtos/login.dto';
import { LocalAuthGuard, JwtAuthGuard } from '../../infra/guards/auth.guard';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { Response } from 'express';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../infra/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('refresh')
  reIssueAccessToken(@Body() { refreshToken }: { refreshToken: string }) {
    const token = this.authService.reIssueAccessToken(refreshToken);
    return {
      accessToken: token,
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

  @Post('find-password')
  async findPassword(@Body('email') email: string) {
    return this.authService.findPassword(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: User): Promise<User> {
    return this.authService.getMe(user);
  }

  //--- html response ---
  @Get('find-password')
  async getPasswordHtml(@Res() res: Response, @Query('token') token: string) {
    const { tempPassword, viewName } = await this.authService.findTempPassword(
      token,
    );
    res.setHeader(
      'Content-Security-Policy',
      "img-src 'self' https://antville-test.s3.ap-northeast-2.amazonaws.com",
    );
    return res.render(viewName, { tempPassword });
  }

  @Get('verify')
  async verifyEmail(@Res() res: Response, @Query('token') token: string) {
    const { viewName } = await this.authService.verifyEmail(token);
    res.setHeader(
      'Content-Security-Policy',
      "img-src 'self' https://antville-test.s3.ap-northeast-2.amazonaws.com",
    );
    return res.render(viewName);
  }
}
