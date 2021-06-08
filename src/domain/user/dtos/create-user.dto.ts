import { User } from '../entities/user.entity';

export class CreateUserInput {
  email: string;
  nickname: string;
  password: string;
  subscribeNewsLetter: boolean;

  toUser() {
    const user = new User();
    user.email = this.email;
    user.nickname = this.nickname;
    user.password = this.password;
    user.subscribeNewsLetter = this.subscribeNewsLetter;
    return user;
  }
}
