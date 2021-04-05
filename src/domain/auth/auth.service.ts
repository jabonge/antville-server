import { LoginResponseDto } from './dtos/login.dto';
import { UserService } from '../user/user.service';
import { JwtPayload } from './auth.interface';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { BadRequestException, Injectable } from '@nestjs/common';
import CustomError from '../../util/constant/exception';

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

  issueAccessToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  issueRefreshToken(payload: JwtPayload) {
    const signOption: JwtSignOptions = {
      secret: this.jwtRefreshKey,
      expiresIn: '365d',
    };

    const token = this.jwtService.sign(payload, signOption);
    return token;
  }

  reIssueAccessToken(token: string) {
    const decodedUser = this.verifyRefreshToken(token);
    if (decodedUser) {
      return this.issueAccessToken({
        id: decodedUser.id,
        email: decodedUser.email,
        nickname: decodedUser.nickname,
      });
    } else {
      throw new BadRequestException('Invalid Refresh Token');
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
    if (!user) {
      throw new BadRequestException(CustomError.EMAIL_NOT_FOUND);
    }
    await user.checkPassword(password);
    delete user.password;
    return user;
  }

  async login(user: User): Promise<LoginResponseDto> {
    const accessToken = this.issueAccessToken(user.toJwtPayload());
    const refreshToken = this.issueRefreshToken(user.toJwtPayload());
    await this.userService.saveRefreshToken(user.id, refreshToken);
    return {
      accessToken,
      refreshToken,
    };
  }
}
