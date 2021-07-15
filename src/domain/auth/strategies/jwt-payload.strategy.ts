import { UserService } from '../../user/services/user.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth.interface';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtPayloadStrategy extends PassportStrategy(
  Strategy,
  'jwt-payload',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_KEY'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.id,
      nickname: payload.nickname,
    };
  }
}
