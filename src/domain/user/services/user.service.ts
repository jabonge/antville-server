import { JwtService } from '@nestjs/jwt';
import { CreateNotificationDto } from '../../notification/dto/create-notification.dto';
import { plainToClass } from 'class-transformer';
import { CreateUserInput } from '../dtos/create-user.dto';
import { User } from '../entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, In, IsNull, MoreThan, Not, Repository } from 'typeorm';
import { UserCount } from '../entities/user-count.entity';
import { EditProfileDto } from '../dtos/edit-profile.dto';
import CustomError from '../../../util/constant/exception';
import { NotificationService } from '../../notification/notification.service';
import { NotificationType } from '../../notification/entities/notification.entity';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { BlockType, UserBlock } from '../entities/user-block.entity';
import {
  FindPasswordPayload,
  VerifyEmailPayload,
} from '../../auth/auth.interface';
import { SesService } from '../../../shared/ses/ses.service';

@Injectable()
export class UserService {
  constructor(
    private connection: Connection,
    private readonly sesService: SesService,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmailWithPassword(email: string) {
    return this.userRepository.findOne(
      { email },
      { select: ['id', 'password', 'email', 'nickname'] },
    );
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne(
      { email },
      { select: ['id', 'email', 'nickname'] },
    );
  }

  async findByNicknames(nicknames: string[], userId: number) {
    const users = await this.userRepository
      .createQueryBuilder('u')
      .select(['u.id', 'u.nickname'])
      .where('u.nickname IN (:...nicknames)', { nicknames })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select()
          .from(UserBlock, 'ub')
          .where(`ub.blockerId = ${userId}`)
          .andWhere(`u.id = ub.blockedId`)
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
      throw new BadRequestException(CustomError.INVALID_USER);
    }
    return user;
  }

  findById(id: number) {
    return this.userRepository.findOne(id, {
      select: [
        'id',
        'nickname',
        'profileImg',
        'isEmailVerified',
        'influencerBadge',
        'wadizBadge',
        'isBannded',
      ],
    });
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
      return { available: false };
    }
    return { available: true };
  }

  async nicknameDuplicateCheck(nickname: string) {
    const user = await this.userRepository.findOne(
      { nickname },
      { select: ['id'] },
    );
    if (user) {
      return { available: false };
    }
    return { available: true };
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
      throw new BadRequestException(CustomError.DUPLICATED_NICKNAME);
    }

    const user = plainToClass(CreateUserInput, input).toUser();
    user.userCount = new UserCount();
    user.bio = `안녕하세요 앤트빌 주민 ${user.nickname} 입니다.`;
    await this.userRepository.save(user);
    return;
  }

  async isBlockingOrBlockedUser(myId: number, userId: number) {
    const count = await this.connection.manager.count(UserBlock, {
      blockerId: myId,
      blockedId: userId,
    });
    return count > 0;
  }

  async blockUser(myId: number, userId: number) {
    if (await this.isBlockingOrBlockedUser(myId, userId)) {
      return;
    }
    const isFollowing = await this.isFollowing(myId, userId);
    const isFollowed = await this.isFollowed(myId, userId);

    await this.connection.transaction(async (manager) => {
      const blocker = new UserBlock();
      blocker.blockerId = myId;
      blocker.blockedId = userId;
      blocker.blockType = BlockType.BLOCKING;
      const blockedUser = new UserBlock();
      blockedUser.blockerId = userId;
      blockedUser.blockedId = myId;
      blockedUser.blockType = BlockType.BLOCKED;
      await manager.save(UserBlock, [blocker, blockedUser]);
      if (isFollowing) {
        await Promise.all([
          manager
            .createQueryBuilder(User, 'u')
            .relation(User, 'following')
            .of(myId)
            .remove(userId),
          manager.decrement(
            UserCount,
            {
              userId: myId,
              following: MoreThan(0),
            },
            'following',
            1,
          ),
          manager.decrement(
            UserCount,
            {
              userId,
              followers: MoreThan(0),
            },
            'followers',
            1,
          ),
        ]);
      }
      if (isFollowed) {
        await Promise.all([
          manager
            .createQueryBuilder(User, 'u')
            .relation(User, 'following')
            .of(userId)
            .remove(myId),
          manager.decrement(
            UserCount,
            {
              userId,
              following: MoreThan(0),
            },
            'following',
            1,
          ),
          manager.decrement(
            UserCount,
            {
              userId: myId,
              followers: MoreThan(0),
            },
            'followers',
            1,
          ),
        ]);
      }
    });
    return;
  }

  async unBlockUser(myId: number, userId: number) {
    if (!(await this.isBlockingOrBlockedUser(myId, userId))) {
      return;
    }
    await this.connection.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(UserBlock)
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
      throw new BadRequestException(CustomError.BLOCK_OR_BLOCKED_USER);
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
        manager.increment(
          UserCount,
          {
            userId: me.id,
          },
          'following',
          1,
        ),
        manager.increment(
          UserCount,
          {
            userId,
          },
          'followers',
          1,
        ),
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
        manager.decrement(
          UserCount,
          {
            userId: myId,
            following: MoreThan(0),
          },
          'following',
          1,
        ),
        manager.decrement(
          UserCount,
          {
            userId,
            followers: MoreThan(0),
          },
          'followers',
          1,
        ),
      ]);
    });
    return;
  }

  async isFollowing(myId: number, userId: number) {
    const row = await this.userRepository.manager.query(
      `SELECT COUNT(*) as count FROM follow WHERE followerId = ${myId} AND followingId = ${userId}`,
    );
    return row[0].count > 0;
  }

  async isFollowed(myId: number, userId: number) {
    const row = await this.userRepository.manager.query(
      `SELECT COUNT(*) as count FROM follow WHERE followingId = ${myId} AND followerId = ${userId}`,
    );
    return row[0].count > 0;
  }

  searchUser(query: string, cursor: number, limit: number) {
    const dbQuery = this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.nickname',
        'u.profileImg',
        'u.wadizBadge',
        'u.influencerBadge',
      ])
      .orWhere(`u.nickname like '${query}%'`)
      .take(limit);
    if (cursor) {
      dbQuery.andWhere('u.id < :cursor', { cursor });
    }
    return dbQuery.getMany();
  }

  findFollowers(userId: number, cursor: number, limit: number) {
    const cursorWhere = cursor ? `AND followerId < ${cursor}` : '';
    const dbQuery = this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.nickname',
        'u.profileImg',
        'u.wadizBadge',
        'u.influencerBadge',
      ])
      .innerJoin(
        `(SELECT followerId FROM follow WHERE followingId = ${userId} ${cursorWhere} ORDER BY followerId DESC LIMIT ${limit})`,
        'f',
        'u.id = f.followerId',
      );
    return dbQuery.getMany();
  }

  findFollowing(userId: number, cursor: number, limit: number) {
    const cursorWhere = cursor ? `AND followingId < ${cursor}` : '';
    const dbQuery = this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.nickname',
        'u.profileImg',
        'u.wadizBadge',
        'u.influencerBadge',
      ])
      .innerJoin(
        `(SELECT followingId FROM follow WHERE followerId = ${userId} ${cursorWhere} ORDER BY followingId DESC LIMIT ${limit})`,
        'f',
        'u.id = f.followingId',
      );
    return dbQuery.getMany();
  }

  findBlocking(userId: number, cursor: number, limit: number) {
    const dbQuery = this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.nickname',
        'u.profileImg',
        'u.wadizBadge',
        'u.influencerBadge',
      ])
      .innerJoin(
        'u.blockedUsers',
        'b',
        `b.blockerId = ${userId} AND b.blockType = "BLOCKING"`,
      )
      .orderBy('u.id', 'DESC')
      .limit(limit);

    if (cursor) {
      dbQuery.andWhere('u.id < :cursor', { cursor });
    }
    return dbQuery.getMany();
  }

  findRecommendUser() {
    const dbQuery = this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.nickname',
        'u.profileImg',
        'u.wadizBadge',
        'u.influencerBadge',
      ])
      .where(`u.isRecommendUser IS NOT NULL`)
      .orderBy('u.isRecommendUser', 'ASC')
      .limit(15);
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
    await this.userRepository.update(
      {
        id: userId,
      },
      editProfileDto,
    );
    return;
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

  async removeProfileImg(userId: number) {
    await this.userRepository.update(
      {
        id: userId,
      },
      {
        profileImg: null,
      },
    );
    return;
  }

  async updateFcmToken(userId: number, fcmToken: string) {
    await this.userRepository.update(userId, {
      fcmToken,
    });
    return;
  }

  async changePushAlarm(userId: number, push: boolean) {
    await this.userRepository.update(userId, {
      pushAlarm: push,
    });
    return;
  }

  async findFcmTokens(userIds: number[]) {
    return this.userRepository.find({
      select: ['fcmToken'],
      where: {
        id: In(userIds),
        fcmToken: Not(IsNull()),
        pushAlarm: true,
      },
    });
  }

  async changePassword(
    userId: number,
    { changePassword, currentPassword }: ChangePasswordDto,
  ) {
    if (changePassword === currentPassword) {
      throw new BadRequestException(
        '현재 비밀번호와 동일한 비밀번호로 변경 할 수 없습니다.',
      );
    }
    const userHasPassword = await this.userRepository.findOneOrFail(userId, {
      select: ['id', 'password'],
    });
    if (await userHasPassword.checkPassword(currentPassword)) {
      userHasPassword.password = changePassword;
      await this.save(userHasPassword);
    }
  }

  async changeTempPassword(payload: FindPasswordPayload) {
    const userHasPassword = await this.userRepository.findOneOrFail(
      payload.userId,
      {
        select: ['id', 'password'],
      },
    );
    if (await userHasPassword.checkPassword(payload.tempPassword, false)) {
      return;
    }
    userHasPassword.password = payload.tempPassword;
    await this.save(userHasPassword);
  }

  async verifyEmail(payload: VerifyEmailPayload) {
    const user = await this.userRepository.findOne(payload.userId, {
      select: ['id', 'isEmailVerified'],
    });
    if (user.isEmailVerified) {
      return;
    }
    user.isEmailVerified = true;
    await this.save(user);
    return;
  }

  async sendVerifyEmail(user: User) {
    const emailUser = await this.userRepository.findOne(user.id, {
      select: ['id', 'nickname', 'email', 'isEmailVerified'],
    });
    if (user.isEmailVerified) {
      throw new BadRequestException('이미 인증을 완료한 계정입니다.');
    }
    const token = this.jwtService.sign(
      {
        userId: user.id,
      },
      {
        expiresIn: '1h',
        secret: process.env.VERIFY_EMAIL_SECRET_KEY,
      },
    );
    await this.sesService.verifyEmail(
      token,
      emailUser.nickname,
      emailUser.email,
    );
    return;
  }
}
