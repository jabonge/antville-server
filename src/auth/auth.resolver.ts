import { GetMeResponse } from './dtos/get-me.dto';
import { User } from './../user/entities/user.entity';
import { LoginResponse } from './dtos/login.dto';
import { AuthService } from './auth.service';
import { Args, Mutation, Resolver, Query } from '@nestjs/graphql';
import { CurrentUser } from '../common/decorators/user.decorator';
import { UseGuards } from '@nestjs/common';
import { LocalAuthGuard, JwtGqlAuthGuard } from './guards/auth.guard';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Mutation(() => LoginResponse)
  login(
    @CurrentUser() user: User,
    @Args('email') _: string,
    @Args('password') __: string,
  ): Promise<LoginResponse> {
    return this.authService.login(user);
  }

  @Query(() => GetMeResponse)
  @UseGuards(JwtGqlAuthGuard)
  getMe(@CurrentUser() user: User): GetMeResponse {
    return user;
  }
}
