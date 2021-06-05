import { LoginResponseDto } from './dtos/login.dto';
import { UserService } from '../user/user.service';
import { FindPasswordPayload, JwtPayload } from './auth.interface';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import CustomError from '../../util/constant/exception';
import { TokenExpiredError } from 'jsonwebtoken';
import { SesService } from '../../shared/ses/ses.service';

@Injectable()
export class AuthService {
  jwtRefreshKey: string;
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly sesService: SesService,
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

  issueFindPasswordToken(payload: FindPasswordPayload) {
    const signOption: JwtSignOptions = {
      expiresIn: '1d',
    };

    const token = this.jwtService.sign(payload, signOption);
    return token;
  }

  reIssueAccessToken(token: string) {
    try {
      const decodedUser = this.verifyRefreshToken(token);
      if (decodedUser) {
        return this.issueAccessToken({
          id: decodedUser.id,
          email: decodedUser.email,
          nickname: decodedUser.nickname,
        });
      } else {
        throw new UnauthorizedException(CustomError.INVALID_REFRESH_TOKEN);
      }
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new UnauthorizedException(CustomError.REFRESH_TOKEN_EXPIRED);
      } else {
        throw e;
      }
    }
  }

  verifyRefreshToken(token: string) {
    const decoded = this.jwtService.verify<JwtPayload>(token, {
      secret: this.jwtRefreshKey,
    });
    return decoded;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmailWithPassword(email);
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

  async getMe(user: User): Promise<User> {
    return this.userService.getUserProfile(user.id);
  }

  async findPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException(CustomError.EMAIL_NOT_FOUND);
    }
    const token = this.issueFindPasswordToken({
      userId: user.id,
      tempPassword: Math.floor(100000 + Math.random() * 900000).toString(),
    });
    await this.sesService.sendPasswordEmail(token, user.nickname, user.email);
    return;
  }
}
