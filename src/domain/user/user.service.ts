import { plainToClass } from 'class-transformer';
import { CreateUserInput } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, Repository } from 'typeorm';
import { UserCount } from './entities/user-count.entity';
import { EditProfileDto } from './dto/edit-profile.dto';
import { StockCount } from '../stock/entities/stock-count.entity';

@Injectable()
export class UserService {
  constructor(
    private connection: Connection,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async removeWatchList(userId: number, stockId: number) {
    await this.connection.transaction(async (manager) => {
      await manager
        .createQueryBuilder(User, 'u')
        .relation(User, 'stocks')
        .of(userId)
        .remove(stockId);
      await this.decrementUserCount(manager, userId, 'watchStockCount');
      await manager.decrement(
        StockCount,
        {
          stockId,
        },
        'watchUserCount',
        1,
      );
    });
    return;
  }

  async addWatchList(userId: number, stockId: number) {
    await this.connection.transaction(async (manager) => {
      const userCount = await manager.findOne(UserCount, { userId });
      if (userCount.watchStockCount >= 20) {
        throw new BadRequestException('WatchList Limit Exceed');
      }
      await manager
        .createQueryBuilder(User, 'u')
        .relation(User, 'stocks')
        .of(userId)
        .add(stockId);
      await this.incrementUserCount(manager, userId, 'watchStockCount');
      await manager.increment(
        StockCount,
        {
          stockId,
        },
        'watchUserCount',
        1,
      );
    });
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
      throw new BadRequestException('Email is duplicated');
    }
    const duplicatedNicknameUser = await this.userRepository.findOne({
      nickname: input.nickname,
    });
    if (duplicatedNicknameUser) {
      throw new BadRequestException('Nickname is duplicated');
    }

    const user = plainToClass(CreateUserInput, input).toUser();
    user.userCount = new UserCount();
    await this.userRepository.save(user);
    return;
  }

  async findFollwingIds(userId: number): Promise<number[]> {
    const users = await this.userRepository.manager.query(
      `SELECT followingId as id FROM users_follows WHERE followerId = ${userId}`,
    );
    const userIds = users.map((u) => u.id);
    if (userIds.length <= 0) {
      return [];
    }
    return userIds;
  }

  async findBlockingAndBlockerIds(userId: number): Promise<number[]> {
    const users = await this.userRepository.manager.query(
      `SELECT blockingId,blockerId FROM users_blocks WHERE blockerId = ${userId} OR blockingId = ${userId}`,
    );
    const userIds = users.map((u) => {
      if (u.blockerId == userId) {
        return u.blockingId;
      } else {
        return u.blockerId;
      }
    });
    if (userIds.length <= 0) {
      return [];
    }
    return userIds;
  }

  async blockUser(myId: number, userId: number) {
    await this.connection.transaction(async (manager) => {
      await manager.findOneOrFail(User, userId, {
        select: ['id'],
      });
      await manager
        .createQueryBuilder(User, 'u')
        .relation(User, 'blocking')
        .of(myId)
        .add(userId);
      await manager
        .createQueryBuilder(User, 'u')
        .relation(User, 'following')
        .of(myId)
        .remove(userId);
      await this.decrementUserCount(manager, myId, 'following');
      await this.decrementUserCount(manager, userId, 'followers');
    });

    return;
  }

  async unBlockUser(myId: number, userId: number) {
    await this.connection.transaction(async (manager) => {
      await manager.findOneOrFail(User, userId, {
        select: ['id'],
      });
      await manager
        .createQueryBuilder(User, 'u')
        .relation(User, 'blocking')
        .of(myId)
        .remove(userId);
    });
    return;
  }

  async followUser(myId: number, userId: number) {
    const users = await this.userRepository.manager.query(
      `SELECT blockingId,blockerId FROM users_blocks WHERE (blockerId = ${myId} AND blockingId = ${userId}) OR (blockerId = ${userId} AND blockingId = ${myId}))`,
    );
    if (users) {
      throw new BadRequestException(
        'Blocked Or Blocking User DO Not Allow Following',
      );
    }
    await this.connection.transaction(async (manager) => {
      await manager.findOneOrFail(User, userId, {
        select: ['id'],
      });
      await manager
        .createQueryBuilder(User, 'u')
        .relation(User, 'following')
        .of(myId)
        .add(userId);
      await this.incrementUserCount(manager, myId, 'following');
      await this.incrementUserCount(manager, userId, 'followers');
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
      await this.decrementUserCount(manager, myId, 'following');
      await this.decrementUserCount(manager, userId, 'followers');
    });
    return;
  }

  searchUser(query: string, cursor: number, limit: number) {
    const dbQuery = this.userRepository
      .createQueryBuilder()
      .select(['id', 'nickname', 'name', 'profileImg'])
      .orWhere(`name LIKE ${query}%`)
      .orWhere(`MATCH(nickname) AGAINST ('*${query}*' IN BOOLEAN MODE)`)
      .take(limit);
    if (cursor) {
      dbQuery.andWhere('id < :cursor', { cursor });
    }
    return dbQuery.getMany();
  }

  async editProfile(userId: number, editProfileDto: EditProfileDto) {
    if (editProfileDto.nickname) {
      const nicknameUser = await this.userRepository.findOne({
        nickname: editProfileDto.nickname,
      });
      if (nicknameUser) {
        throw new BadRequestException('Nickname is duplicated');
      } else if (!editProfileDto.bio) {
        return this.userRepository.update(
          {
            id: userId,
          },
          {
            nickname: editProfileDto.nickname,
          },
        );
      } else {
        return this.userRepository.update(
          {
            id: userId,
          },
          {
            nickname: editProfileDto.nickname,
            bio: editProfileDto.bio,
          },
        );
      }
    } else {
      return this.userRepository.update(
        {
          id: userId,
        },
        {
          bio: editProfileDto.bio,
        },
      );
    }
  }

  async updateProfileImg(userId: number, profileImg: Express.MulterS3.File) {
    await this.userRepository.update(
      {
        id: userId,
      },
      {
        profileImg: profileImg.location,
      },
    );
    return { profileImg: profileImg.location };
  }

  removeProfileImg(userId: number) {
    return this.userRepository.update(
      {
        id: userId,
      },
      {
        profileImg: null,
      },
    );
  }

  incrementUserCount(manager: EntityManager, userId: number, property: string) {
    return manager.increment(
      UserCount,
      {
        userId,
      },
      property,
      1,
    );
  }

  decrementUserCount(manager: EntityManager, userId: number, property: string) {
    return manager.decrement(
      UserCount,
      {
        userId,
      },
      property,
      1,
    );
  }
}
