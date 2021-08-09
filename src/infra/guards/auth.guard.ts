import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtPayloadAuthGuard extends AuthGuard('jwt-payload') {}

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}

@Injectable()
export class ConditionAuthGuard extends AuthGuard('jwt-payload') {
  handleRequest(_, user, err, context) {
    const request = context.switchToHttp().getRequest();
    if (user) {
      return user;
    } else if (request.headers.authorization && err) {
      throw new UnauthorizedException();
    }
    return null;
  }
}
