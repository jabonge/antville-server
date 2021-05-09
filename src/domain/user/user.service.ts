import { CreateNotificationDto } from './../notification/dto/create-notification.dto';
import { plainToClass } from 'class-transformer';
import { CreateUserInput } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Connection,
  EntityManager,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
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

  async findByNicknames(nicknames: string[], user: User) {
    const blockUserIds = await this.findBlockingAndBlockerIds(user.id);
    let users = await this.userRepository.find({
      where: {
        nickname: In(nicknames),
      },
      select: ['id', 'nickname', 'profileImg'],
    });
    users = users.filter(
      (u) => !blockUserIds.includes(u.id) && u.id !== user.id,
    );
    return users;
  }

  async getUserProfileByNickname(nickname: string, myId?: number) {
    const query = this.userRepository
      .createQueryBuilder('u')
      .where('u.nickname = :nickname', { nickname })
      .innerJoinAndSelect('u.userCount', 'userCount');

    if (myId) {
      query
        .leftJoin('u.followers', 'f', 'f.id = :myId', { myId })
        .addSelect(['f.id']);
    }
    const user = await query.getOne();
    if (!user) {
      throw new BadRequestException();
    }
    return user;
  }

  async findById(id: number) {
    const user = this.userRepository.findOne({ id });
    return user;
  }

  async getUserProfile(userId: number, myId?: number) {
    const query = this.userRepository
      .createQueryBuilder('u')
      .where('u.id = :userId', { userId })
      .innerJoinAndSelect('u.userCount', 'userCount');

    if (myId) {
      query
        .leftJoin('u.followers', 'f', 'f.id = :myId', { myId })
        .addSelect(['f.id']);
    }
    const user = await query.getOne();
    if (!user) {
      throw new BadRequestException();
    }
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
    if (!(await this.isWatching(userId, stockId))) {
      return;
    }
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
    if (await this.isWatching(userId, stockId)) {
      return;
    }
    await this.connection.transaction(async (manager) => {
      const userCount = await manager.findOne(UserCount, { userId });
      if (userCount.watchStockCount > 19) {
        throw new BadRequestException(CustomError.WATCH_LIST_LIMIT_EXCEED);
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
    if (!userId) {
      return [];
    }
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

  async isBlockingOrBlockedUser(myId: number, userId: number) {
    const row = await this.userRepository.manager.query(
      `SELECT COUNT(*) as count FROM users_blocks WHERE (blockerId = ${myId} AND blockingId = ${userId}) OR (blockerId = ${userId} AND blockingId = ${myId});`,
    );
    return row[0].count > 0;
  }

  async blockUser(myId: number, userId: number) {
    if (await this.isBlocking(myId, userId)) {
      return;
    }
    const isFollowing = await this.isFollowing(myId, userId);
    const isFollowed = await this.isFollowed(myId, userId);

    await this.connection.transaction(async (manager) => {
      await manager
        .createQueryBuilder(User, 'u')
        .relation(User, 'blocking')
        .of(myId)
        .add(userId);
      if (isFollowing) {
        await Promise.all([
          manager
            .createQueryBuilder(User, 'u')
            .relation(User, 'following')
            .of(myId)
            .remove(userId),
          this.decrementUserCount(manager, myId, 'following'),
          this.decrementUserCount(manager, userId, 'followers'),
        ]);
      } else if (isFollowed) {
        await Promise.all([
          manager
            .createQueryBuilder(User, 'u')
            .relation(User, 'following')
            .of(userId)
            .remove(myId),
          this.decrementUserCount(manager, userId, 'following'),
          this.decrementUserCount(manager, myId, 'followers'),
        ]);
      }
    });
    return;
  }

  async unBlockUser(myId: number, userId: number) {
    if (!this.isBlocking(myId, userId)) {
      return;
    }
    await this.connection.transaction(async (manager) => {
      await manager
        .createQueryBuilder(User, 'u')
        .relation(User, 'blocking')
        .of(myId)
        .remove(userId);
    });

    return;
  }

  async followUser(me: User, userId: number) {
    if (await this.isFollowing(me.id, userId)) {
      return;
    }
    const isBlockingOrBlocked = await this.isBlockingOrBlockedUser(
      me.id,
      userId,
    );
    if (isBlockingOrBlocked) {
      throw new BadRequestException(
        'Blocked Or Blocking User Do Not Allow Following',
      );
    }
    const createNotificationDto = new CreateNotificationDto();
    createNotificationDto.viewerId = userId;
    createNotificationDto.user = me;
    createNotificationDto.type = NotificationType.FOLLOW;
    createNotificationDto.param = me.nickname;
    await this.connection.transaction(async (manager) => {
      await Promise.all([
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
    if (!this.isFollowing(myId, userId)) {
      return;
    }
    await this.connection.transaction(async (manager) => {
      await Promise.all([
        manager
          .createQueryBuilder(User, 'u')
          .relation(User, 'following')
          .of(myId)
          .remove(userId),
        this.decrementUserCount(manager, myId, 'following'),
        this.decrementUserCount(manager, userId, 'followers'),
      ]);
    });
    return;
  }

  async isWatching(myId: number, stockId: number) {
    const row = await this.userRepository.manager.query(
      `SELECT COUNT(*) as count FROM watchlist WHERE userId = ${myId} AND stockId = ${stockId}`,
    );
    return row[0].count > 0;
  }

  async isFollowing(myId: number, userId: number) {
    const row = await this.userRepository.manager.query(
      `SELECT COUNT(*) as count FROM users_follows WHERE followerId = ${myId} AND followingId = ${userId}`,
    );
    return row[0].count > 0;
  }

  async isFollowed(myId: number, userId: number) {
    const row = await this.userRepository.manager.query(
      `SELECT COUNT(*) as count FROM users_follows WHERE followingId = ${myId} AND followerId = ${userId}`,
    );
    return row[0].count > 0;
  }

  async isBlocking(myId: number, userId: number) {
    const row = await this.userRepository.manager.query(
      `SELECT COUNT(*) as count FROM users_blocks WHERE blockerId = ${myId} AND blockingId = ${userId}`,
    );
    return row[0].count > 0;
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

  findFollowers(userId: number, cursor: number, limit: number) {
    const cursorWhere = cursor ? `AND  < ${cursor}` : '';
    const dbQuery = this.userRepository
      .createQueryBuilder('u')
      .innerJoin(
        `(SELECT followerId FROM users_follows WHERE followingId = ${userId} ${cursorWhere} ORDER BY followerId DESC LIMIT ${limit})`,
        'u_f',
        'u.id = u_f.followerId',
      );
    return dbQuery.getMany();
  }

  findFollowing(userId: number, cursor: number, limit: number) {
    const cursorWhere = cursor ? `AND  < ${cursor}` : '';
    const dbQuery = this.userRepository
      .createQueryBuilder('u')
      .innerJoin(
        `(SELECT followingId FROM users_follows WHERE followerId = ${userId} ${cursorWhere} ORDER BY followingId DESC LIMIT ${limit})`,
        'u_f',
        'u.id = u_f.followingId',
      );
    return dbQuery.getMany();
  }

  findBlocking(userId: number, cursor: number, limit: number) {
    const cursorWhere = cursor ? `AND  < ${cursor}` : '';
    const dbQuery = this.userRepository
      .createQueryBuilder('u')
      .innerJoin(
        `(SELECT blockingId FROM users_blocks WHERE blockerId = ${userId} ${cursorWhere} ORDER BY blockingId DESC LIMIT ${limit})`,
        'u_b',
        'u.id = u_b.blockingId',
      );
    return dbQuery.getMany();
  }

  async editProfile(userId: number, editProfileDto: EditProfileDto) {
    Object.keys(editProfileDto).forEach((key) => {
      if (editProfileDto[key] === undefined) {
        delete editProfileDto[key];
      }
    });
    if (editProfileDto.nickname) {
      const nicknameUser = await this.userRepository.findOne({
        nickname: editProfileDto.nickname,
      });
      if (nicknameUser) {
        throw new BadRequestException(CustomError.DUPLICATED_NICKNAME);
      }
    }
    return this.userRepository.update(
      {
        id: userId,
      },
      editProfileDto,
    );
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

  async updateFcmToken(userId: number, fcmToken: string) {
    await this.userRepository.update(userId, {
      fcmToken,
    });
    return;
  }

  async findFcmTokens(userIds: number[]) {
    return this.userRepository.find({
      select: ['fcmToken'],
      where: {
        id: In(userIds),
        fcmToken: Not(IsNull()),
      },
    });
  }
}
