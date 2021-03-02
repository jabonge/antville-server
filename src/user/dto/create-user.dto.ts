import { User } from './../entities/user.entity';
import { InputType, PickType } from '@nestjs/graphql';

@InputType()
export class CreateUserInput extends PickType(
  User,
  ['email', 'password', 'name', 'nickname'],
  InputType,
) {
  toUser() {
    const user = new User();
    user.email = this.email;
    user.nickname = this.nickname;
    user.name = this.name;
    user.password = this.password;
    return user;
  }
}
