import { Injectable } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtPayloadAuthGuard extends AuthGuard('jwt-payload') {}

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}

@Injectable()
export class ConditionAuthGuard extends AuthGuard('jwt-payload') {
  handleRequest(_, user, __, ___) {
    if (user) {
      return user;
    }
    return null;
  }
}
