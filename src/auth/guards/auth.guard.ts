import { JwtPayload } from '../auth.interface';
import {
  ExecutionContext,
  Injectable,
  CanActivate,
  BadRequestException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}

@Injectable()
export class JwtGqlWsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  canActivate(context: ExecutionContext) {
    console.log('hello');
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.token;
    console.log(token);
    if (!token) {
      throw new BadRequestException('Bearer Token Not Found');
    }
    const decoded = this.jwtService.verify<JwtPayload>(token);

    if (decoded) {
      gqlContext['user'] = decoded;
      return true;
    }

    return false;
  }
}

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext) {
    await super.canActivate(context);
    return true;
  }
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    request.body = ctx.getArgs();
    return request;
  }
}
