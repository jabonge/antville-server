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
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
import { UserCount } from './entities/user-count.entity';
import { EditProfileDto } from './dto/edit-profile.dto';
import { StockCount } from '../stock/entities/stock-count.entity';
import CustomError from '../../util/constant/exception';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { WatchList } from './entities/watchlist.entity';
import { LexoRank } from 'lexorank';
import {
  ChangeType,
  ChangeWatchListOrderDto,
} from './dto/change-watchlist-order.dto';
import { genLexoRankList } from '../../util/lexorank';
import { BlockType, UserToBlock } from './entities/user-block.entity';

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
    const users = this.userRepository
      .createQueryBuilder('u')
      .select(['id', 'nickname', 'profileImg'])
      .where('u.nickname IN (:...nicknames)', { nicknames })
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select()
          .from(UserToBlock, 'utb')
          .where(`utb.blockerId = ${user.id}`)
          .andWhere(`u.id = utb.blockedId`)
          .getQuery();
        return 'NOT EXISTS ' + subQuery;
      })
      .limit(10)
      .getMany();

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

  async changeWatchListOrder(
    userId: number,
    { stockId, betweenStockIds, type }: ChangeWatchListOrderDto,
  ) {
    const findWatchList = await this.connection.manager.find(WatchList, {
      where: {
        userId,
        stockId: In(betweenStockIds),
      },
    });
    const updateWatchList = await this.connection.manager.findOneOrFail(
      WatchList,
      {
        where: {
          userId,
          stockId,
        },
      },
    );
    let newLexoRank: LexoRank;
    if (type === ChangeType.FIRST) {
      if (findWatchList.length !== 1) {
        throw new BadRequestException();
      }
      const lexorank = LexoRank.parse(findWatchList[0].lexorank);
      newLexoRank = lexorank.genPrev();
      updateWatchList.lexorank = newLexoRank.toString();
    } else if (type === ChangeType.LAST) {
      if (findWatchList.length !== 1) {
        throw new BadRequestException();
      }
      const lexorank = LexoRank.parse(findWatchList[0].lexorank);
      newLexoRank = lexorank.genNext();
      updateWatchList.lexorank = newLexoRank.toString();
    } else if (type === ChangeType.BETWEEN) {
      if (findWatchList.length !== 2) {
        throw new BadRequestException();
      }
      const firstLexoRank = LexoRank.parse(findWatchList[0].lexorank);
      const secondLexoRank = LexoRank.parse(findWatchList[1].lexorank);
      newLexoRank = firstLexoRank.between(secondLexoRank);
      updateWatchList.lexorank = newLexoRank.toString();
    } else {
      throw new BadRequestException();
    }
    await this.connection.manager.save(WatchList, updateWatchList);
    if (newLexoRank.getDecimal().getScale() > 300) {
      this.lexorankRebalancing(userId);
    }
    return;
  }

  async lexorankRebalancing(userId: number) {
    const findAllWatchList = await this.connection.manager.find(WatchList, {
      where: {
        userId,
      },
      order: {
        lexorank: 'ASC',
      },
    });
    const balancedLexoRankList = genLexoRankList(findAllWatchList.length);
    for (let i = 0; i < findAllWatchList.length; i++) {
      findAllWatchList[i].lexorank = balancedLexoRankList[i];
    }
    await this.connection.manager.save(WatchList, findAllWatchList);
  }

  async removeWatchList(userId: number, stockId: number) {
    if (!(await this.isWatching(userId, stockId))) {
      return;
    }
    await this.connection.transaction(async (manager) => {
      await manager.delete(WatchList, {
        userId,
        stockId,
      });
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

  async removeWatchLists(userId: number, stockIds: number[]) {
    await this.connection.transaction(async (manager) => {
      const findWatchList = await manager.find(WatchList, {
        where: {
          userId,
          stockId: In(stockIds),
        },
      });
      const findStockIds = findWatchList.map((e) => e.stockId);
      if (findWatchList.length <= 0) return;
      await manager.delete(WatchList, {
        userId,
        stockId: In(findStockIds),
      });
      const { watchStockCount } = await manager.findOne(UserCount, { userId });
      if (watchStockCount > stockIds.length) {
        await this.decrementUserCount(
          manager,
          userId,
          'watchStockCount',
          findStockIds.length,
        );
      } else {
        await this.decrementUserCount(
          manager,
          userId,
          'watchStockCount',
          watchStockCount,
        );
      }
      await manager.decrement(
        StockCount,
        {
          stockId: In(findStockIds),
          watchUserCount: MoreThan(0),
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
      const firstWatchList = await manager.find(WatchList, {
        where: {
          userId,
        },
        order: {
          lexorank: 'ASC',
        },
        take: 1,
      });

      const watchList = new WatchList();
      watchList.userId = userId;
      watchList.stockId = stockId;
      if (firstWatchList.length > 0) {
        const first = firstWatchList[0];
        watchList.lexorank = LexoRank.parse(first.lexorank)
          .genPrev()
          .toString();
      }

      await manager.save(WatchList, watchList);
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

  async isBlockingOrBlockedUser(myId: number, userId: number) {
    const row = await this.userRepository.manager.query(
      `SELECT COUNT(*) as count FROM user_to_block WHERE blockerId = ${myId} AND blockedId = ${userId};`,
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
      const blocker = new UserToBlock();
      blocker.blockerId = myId;
      blocker.blockedId = userId;
      blocker.blockType = BlockType.BLOCKING;
      const blockedUser = new UserToBlock();
      blockedUser.blockerId = userId;
      blockedUser.blockedId = myId;
      blockedUser.blockType = BlockType.BLOCKED;
      await manager.save(UserToBlock, [blocker, blockedUser]);
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
    if (!(await this.isBlocking(myId, userId))) {
      return;
    }
    await this.connection.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(UserToBlock)
        .where(`blockerId = ${myId} AND blockedId = ${userId}`)
        .orWhere(`blockerId = ${userId} AND blockedId = ${myId}`)
        .execute();
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
    const count = await this.connection.manager.count(WatchList, {
      userId: myId,
      stockId,
    });
    return count > 0;
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
      `SELECT COUNT(*) as count FROM user_to_block WHERE blockerId = ${myId} AND blockedId = ${userId} AND blockType = 'BLOCKING'`,
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
    const dbQuery = this.userRepository
      .createQueryBuilder('u')
      .innerJoin(
        'u.blockedUsers',
        'bu',
        `bu.blockerId = ${userId} AND bu.blockType = "BLOCKING"`,
      )
      .orderBy('bu.id', 'DESC')
      .limit(limit);

    if (cursor) {
      dbQuery.andWhere('bu.id < :cursor', { cursor });
    }
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

  incrementUserCount(
    manager: EntityManager,
    userId: number,
    property: string,
    count = 1,
  ) {
    return manager.increment(
      UserCount,
      {
        userId,
      },
      property,
      count,
    );
  }

  decrementUserCount(
    manager: EntityManager,
    userId: number,
    property: string,
    count = 1,
  ) {
    return manager.decrement(
      UserCount,
      {
        userId,
      },
      property,
      count,
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

  async changePassword(
    user: User,
    { changePassword, currentPassword }: ChangePasswordDto,
  ) {
    if (changePassword === currentPassword) {
      throw new BadRequestException(
        '현재 비밀번호와 동일한 비밀번호로 변경 할 수 없습니다.',
      );
    }
    const userHasPassword = await this.userRepository.findOneOrFail(user.id, {
      select: ['id', 'password'],
    });
    if (await userHasPassword.checkPassword(currentPassword)) {
      userHasPassword.password = changePassword;
      await this.save(userHasPassword);
    }
  }
}
