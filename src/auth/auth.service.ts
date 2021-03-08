import { LoginResponse } from './dtos/login.dto';
import { UserService } from './../user/user.service';
import { JwtPayload } from './auth.interface';
import { ConfigService } from '@nestjs/config';
import { User } from './../user/entities/user.entity';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { BadRequestException, Injectable } from '@nestjs/common';

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

  issueToken(payload: JwtPayload, isRefresh = false) {
    const signOption: JwtSignOptions = isRefresh
      ? {
          secret: this.jwtRefreshKey,
          expiresIn: '365d',
        }
      : undefined;

    const token = this.jwtService.sign(payload, signOption);
    return token;
  }

  reissueAccessToken(token: string) {
    const decodedUser = this.verifyRefreshToken(token);
    if (decodedUser) {
      return this.issueToken(decodedUser);
    } else {
      throw new BadRequestException('Invalid Token');
    }
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
    const accessToken = this.issueToken(user.toJwtPayload());
    const refreshToken = this.issueToken(user.toJwtPayload(), true);
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
