import { PickType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class CreateUserInput extends PickType(User, [
  'email',
  'password',
  'name',
  'nickname',
]) {
  toUser() {
    const user = new User();
    user.email = this.email;
    user.nickname = this.nickname;
    user.name = this.name;
    user.password = this.password;
    return user;
  }
}
