import { AuthService } from './auth.service';
import { Body, Controller, Post } from '@nestjs/common';

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
}
