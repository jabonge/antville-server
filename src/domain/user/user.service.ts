import { CreateNotificationDto } from './../notification/dto/create-notification.dto';
import { plainToClass } from 'class-transformer';
import { CreateUserInput } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, Repository } from 'typeorm';
import { UserCount } from './entities/user-count.entity';
import { EditProfileDto } from './dto/edit-profile.dto';
import { StockCount } from '../stock/entities/stock-count.entity';
import CustomError from '../../util/constant/exception';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class UserService {
  constructor(
    private connection: Connection,
    private readonly notificationService: NotificationService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    const user = this.userRepository.findOne(
      { email },
      { select: ['id', 'password', 'email', 'nickname'] },
    );
    return user;
  }

  async findByNicknames(nicknames: string[]) {
    const users = this.userRepository.find({
      where: {
        nickname: nicknames,
      },
      select: ['id', 'nickname', 'profileImg'],
    });
    return users;
  }

  async findById(id: number) {
    const user = this.userRepository.findOne({ id });
    return user;
  }

  async getUserProfile(userId: number) {
    const user = this.userRepository.findOne({
      relations: ['userCount'],
      where: {
        id: userId,
      },
    });
    return user;
  }

  async emailDuplicateCheck(email: string) {
    const user = await this.userRepository.findOne(
      { email },
      { select: ['id'] },
    );
    if (user) {
      throw new BadRequestException(CustomError.DUPLICATED_EMAIL);
    }
    return;
  }

  async nicknameDuplicateCheck(nickname: string) {
    const user = await this.userRepository.findOne(
      { nickname },
      { select: ['id'] },
    );
    if (user) {
      throw new BadRequestException(CustomError.DUPLICATED_NICKNAME);
    }
    return;
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
      if (userCount.watchStockCount > 20) {
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
      throw new BadRequestException(CustomError.DUPLICATED_EMAIL);
    }
    const duplicatedNicknameUser = await this.userRepository.findOne({
      nickname: input.nickname,
    });
    if (duplicatedNicknameUser) {
      throw new BadRequestException('Nickname is duplicated');
    }

    const user = plainToClass(CreateUserInput, input).toUser();
    user.userCount = new UserCount();
    user.bio = `안녕하세요 앤트빌 주민 ${user.nickname} 입니다.`;
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
    return Array.from(new Set(userIds));
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

  async followUser(me: User, userId: number) {
    const users = await this.userRepository.manager.query(
      `SELECT blockingId,blockerId FROM users_blocks WHERE (blockerId = ${me.id} AND blockingId = ${userId}) OR (blockerId = ${userId} AND blockingId = ${me.id});`,
    );
    if (users.length > 0) {
      throw new BadRequestException(
        'Blocked Or Blocking User DO Not Allow Following',
      );
    }
    const createNotificationDto = new CreateNotificationDto();
    createNotificationDto.viewerId = userId;
    createNotificationDto.user = me;
    createNotificationDto.type = NotificationType.FOLLOW;
    createNotificationDto.paramId = me.id;
    await this.connection.transaction(async (manager) => {
      await Promise.all([
        manager.findOneOrFail(User, userId, {
          select: ['id'],
        }),
        manager
          .createQueryBuilder(User, 'u')
          .relation(User, 'following')
          .of(me.id)
          .add(userId),
        this.incrementUserCount(manager, me.id, 'following'),
        this.incrementUserCount(manager, userId, 'followers'),
        this.notificationService.create(manager, createNotificationDto),
      ]);
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
      .createQueryBuilder('u')
      .select()
      .orWhere(`u.nickname like '${query}%'`)
      .take(limit);
    if (cursor) {
      dbQuery.andWhere('u.id < :cursor', { cursor });
    }
    return dbQuery.getMany();
  }

  async editProfile(userId: number, editProfileDto: EditProfileDto) {
    if (editProfileDto.nickname) {
      const nicknameUser = await this.userRepository.findOne({
        nickname: editProfileDto.nickname,
      });
      if (nicknameUser) {
        throw new BadRequestException(CustomError.DUPLICATED_NICKNAME);
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
