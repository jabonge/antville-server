import { IsBoolean, IsEmail, IsString } from 'class-validator';
import { IsValidNickname } from '../../../infra/decorators/nickname.decorator';
import { User } from '../entities/user.entity';

export class CreateUserInput {
  @IsEmail()
  email: string;
  @IsString()
  @IsValidNickname({
    message: '유효하지 않은 닉네임 입니다.',
  })
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
