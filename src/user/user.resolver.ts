import { StockService } from './../stock/stock.service';
import { JwtGqlAuthGuard } from './../auth/guards/auth.guard';
import { UseGuards } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.dto';
import { CommonResponse } from './../common/dtos/common-response.dto';
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CurrentUser } from '../common/decorators/user.decorator';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly stockService: StockService,
  ) {}

  @Mutation(() => CommonResponse)
  async signUp(@Args('input') input: CreateUserInput) {
    return this.userService.signUp(input);
  }

  @Mutation(() => CommonResponse)
  @UseGuards(JwtGqlAuthGuard)
  async addWatchList(@CurrentUser() user: User, @Args('id') stockId: number) {
    const stock = await this.stockService.findById(stockId);
    user.stocks = [stock];
    await this.userService.save(user);
    return {
      ok: true,
    };
  }
}
