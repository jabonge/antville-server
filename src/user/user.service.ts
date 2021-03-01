import { CommonResponse } from './../common/dtos/common-response.dto';
import { CreateUserInput } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    const user = this.userRepository.findOneOrFail(
      { email },
      { select: ['id', 'password'] },
    );
    return user;
  }

  async saveRefreshToken(userId: number, token: string) {
    await this.userRepository.update({ id: userId }, { refreshToken: token });
    return;
  }

  async signUp(input: CreateUserInput): Promise<CommonResponse> {
    const user = new User();
    user.email = input.email;
    user.nickname = input.nickname;
    user.name = input.name;
    user.password = input.password;
    await this.userRepository.save(user);
    return {
      ok: true,
    };
  }
}
