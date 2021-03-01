import { LoginResponse } from './dtos/login.dto';
import { UserService } from './../user/user.service';
import { JwtPayload } from './auth.interface';
import { ConfigService } from '@nestjs/config';
import { User } from './../user/entities/user.entity';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  jwtRefreshKey: string;
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    this.jwtRefreshKey = this.configService.get<string>('JWT_REFRESH_KEY');
  }

  issueToken(user: User, isRefresh = false) {
    const signOption: JwtSignOptions = isRefresh
      ? {
          secret: this.jwtRefreshKey,
          expiresIn: '365d',
        }
      : undefined;

    const token = this.jwtService.sign(user.toJwtPayload(), signOption);
    return token;
  }

  verifyRefreshToken(token: string) {
    const decoded = this.jwtService.verify<JwtPayload>(token, {
      secret: this.jwtRefreshKey,
    });
    return decoded;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    await user.checkPassword(password);
    return user;
  }

  async login(user: User): Promise<LoginResponse> {
    const accessToken = this.issueToken(user);
    const refreshToken = this.issueToken(user, true);
    await this.userService.saveRefreshToken(user.id, refreshToken);
    return {
      ok: true,
      data: {
        accessToken,
        refreshToken,
      },
    };
  }
}
