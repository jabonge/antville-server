import { UserService } from './../../user/user.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../auth.interface';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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
    return this.userService.findById(payload.id);
  }
}
