import { PickType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class CreateUserInput extends PickType(User, [
  'email',
  'password',
  'nickname',
  'subscribeNewsLetter',
]) {
  toUser() {
    const user = new User();
    user.email = this.email;
    user.nickname = this.nickname;
    user.password = this.password;
    user.subscribeNewsLetter = this.subscribeNewsLetter;
    return user;
  }
}
