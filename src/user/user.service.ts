import { plainToClass } from 'class-transformer';
import { CommonResponse } from './../common/dtos/common-response.dto';
import { CreateUserInput } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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

  async findById(id: number) {
    const user = this.userRepository.findOne({ id });
    return user;
  }

  async getWatchList(id: number) {
    const userAndStocks = this.userRepository.findOne({
      where: {
        id,
      },
      relations: ['stock'],
    });
    return userAndStocks;
  }

  removeWatchList(stockId: number, userId: number) {
    return this.userRepository
      .createQueryBuilder()
      .relation(User, 'stocks')
      .of(stockId)
      .remove(userId);
  }

  async save(user: User) {
    return this.userRepository.save(user);
  }

  async saveRefreshToken(userId: number, token: string) {
    await this.userRepository.update({ id: userId }, { refreshToken: token });
    return;
  }

  async signUp(input: CreateUserInput): Promise<CommonResponse> {
    const duplicatedEmailUser = await this.userRepository.findOne({
      email: input.email,
    });
    if (duplicatedEmailUser) {
      throw new HttpException('Email is duplicated', HttpStatus.BAD_REQUEST);
    }
    const duplicatedNicknameUser = await this.userRepository.findOne({
      nickname: input.nickname,
    });
    if (duplicatedNicknameUser) {
      throw new HttpException('Nickname is duplicated', HttpStatus.BAD_REQUEST);
    }

    const user = plainToClass(CreateUserInput, input).toUser();
    await this.userRepository.save(user);
    return {
      ok: true,
    };
  }
}
