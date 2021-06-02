import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { UserService } from '../domain/user/user.service';

@Injectable()
export class HtmlService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async findTempPassword(token: string) {
    let tempPassword;
    let errorMessage;
    try {
      const payload = this.jwtService.verify(token);
      tempPassword = payload.tempPassword;
      await this.userService.changeTempPassword(payload);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        errorMessage = '만료된 요청입니다.';
      } else {
        errorMessage = '관리자에게 문의해주세요.';
      }
    }
    if (errorMessage) {
      return { viewName: 'expire' };
    } else {
      return { viewName: 'password', tempPassword };
    }
  }

  async verifyEmail(token: string) {
    let errorMessage;
    try {
      const payload = this.jwtService.verify(token);
      await this.userService.verifyEmail(payload);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        errorMessage = '만료된 요청입니다.';
      } else {
        errorMessage = '관리자에게 문의해주세요.';
      }
    }
    if (errorMessage) {
      return { viewName: 'expire' };
    } else {
      return { viewName: 'verify' };
    }
  }
}
