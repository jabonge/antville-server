import { Injectable } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}

@Injectable()
export class ConditionAuthGuard extends AuthGuard('jwt') {
  handleRequest(_, user, __, ___) {
    return user;
  }
}
