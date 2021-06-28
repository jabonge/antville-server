import { IsBoolean, IsEmail, IsString } from 'class-validator';
import { User } from '../entities/user.entity';

export class CreateUserInput {
  @IsEmail()
  email: string;
  @IsString()
  nickname: string;
  @IsString()
  password: string;
  @IsBoolean()
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
