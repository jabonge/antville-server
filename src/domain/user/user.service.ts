import { plainToClass } from 'class-transformer';
import { CreateUserInput } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { UserCount } from './entities/user-count.entity';

@Injectable()
export class UserService {
  constructor(
    private connection: Connection,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserCount)
    private userCountRepository: Repository<UserCount>,
  ) {}

  async findByEmail(email: string) {
    const user = this.userRepository.findOne(
      { email },
      { select: ['id', 'password', 'email', 'name'] },
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

  async removeWatchList(stockId: number, userId: number) {
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'stocks')
      .of(stockId)
      .remove(userId);
    await this.decrementUserCount(userId, 'watchStockCount');
    return;
  }

  async addWatchList(stockId: number, userId: number) {
    await this.userRepository
      .createQueryBuilder()
      .relation(User, 'stocks')
      .of(stockId)
      .add(userId);
    await this.incrementUserCount(userId, 'watchStockCount');
    return;
  }

  async save(user: User) {
    return this.userRepository.save(user);
  }

  async saveRefreshToken(userId: number, token: string) {
    await this.userRepository.update({ id: userId }, { refreshToken: token });
    return;
  }

  async signUp(input: CreateUserInput) {
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
    user.userCount = new UserCount();
    await this.userRepository.save(user);
    return;
  }

  findFollwingIds(userId: number) {
    return this.userRepository.manager.query(
      `SELECT followingId as id FROM users_follows WHERE followerId = ${userId}`,
    );
  }

  async followUser(myId: number, userId: number) {
    await this.connection.transaction(async (manager) => {
      await manager.findOneOrFail(User, userId, {
        select: ['id'],
      });
      await manager
        .createQueryBuilder(User, 'u')
        .relation(User, 'following')
        .of(myId)
        .add(userId);
      await manager.increment(
        UserCount,
        {
          userId: myId,
        },
        'following',
        1,
      );
      await manager.increment(
        UserCount,
        {
          userId: userId,
        },
        'followers',
        1,
      );
    });
    return;
  }

  async unFollowUser(myId: number, userId: number) {
    await this.connection.transaction(async (manager) => {
      await manager.findOneOrFail(User, userId, {
        select: ['id'],
      });
      await manager
        .createQueryBuilder(User, 'u')
        .relation(User, 'following')
        .of(myId)
        .remove(userId);
      await manager.decrement(
        UserCount,
        {
          userId: myId,
        },
        'following',
        1,
      );
      await manager.decrement(
        UserCount,
        {
          userId: userId,
        },
        'followers',
        1,
      );
    });
    return;
  }

  incrementUserCount(userId: number, property: string) {
    return this.userCountRepository.increment(
      {
        userId,
      },
      property,
      1,
    );
  }

  decrementUserCount(userId: number, property: string) {
    return this.userCountRepository.decrement(
      {
        userId,
      },
      property,
      1,
    );
  }
}
