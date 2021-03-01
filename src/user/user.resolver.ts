import { CreateUserInput } from './dto/create-user.dto';
import { CommonResponse } from './../common/dtos/common-response.dto';
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => CommonResponse)
  async signUp(@Args('input') input: CreateUserInput) {
    return this.userService.signUp(input);
  }
}
