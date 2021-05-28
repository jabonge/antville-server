import { WatchList } from './watchlist.entity';
import { PostToStock } from './../../post/entities/post-stock.entity';
import { JwtPayload } from '../../auth/auth.interface';
import bcrypt from 'bcrypt';
import {
  Column,
  Index,
  JoinTable,
  ManyToMany,
  Entity,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { Post } from '../../post/entities/post.entity';
import { UserCount } from './user-count.entity';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { PostReport } from '../../post/entities/post-report.entity';
import CustomError from '../../../util/constant/exception';
import { Notification } from '../../notification/entities/notification.entity';
import { Exclude, Expose } from 'class-transformer';
import { UserToBlock } from './user-block.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({
    length: 30,
  })
  nickname: string;

  @Column({ unique: true })
  email: string;

  @ApiHideProperty()
  @Column({ select: false })
  password: string;

  @ApiHideProperty()
  @Column({ select: false, nullable: true })
  refreshToken: string;

  @ApiHideProperty()
  @Column({ select: false, nullable: true })
  fcmToken: string;

  @Column({
    select: false,
    default: false,
  })
  isPushAlarmOff: boolean;

  @Column({
    default: false,
  })
  isEmailVerified: boolean;

  @Column({
    default: false,
  })
  subscribeNewsLetter: boolean;

  @Column({
    nullable: true,
  })
  bio?: string;

  @Column({
    nullable: true,
  })
  website?: string;

  @Column({
    nullable: true,
  })
  profileImg?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ApiHideProperty()
  @OneToMany(() => WatchList, (w) => w.user)
  watchStocks: WatchList[];

  @ApiHideProperty()
  @Exclude()
  @ManyToMany(() => User, (user) => user.following)
  followers: User[];

  @ApiHideProperty()
  @Exclude()
  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'users_follows',
    joinColumn: {
      name: 'followerId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'followingId',
      referencedColumnName: 'id',
    },
  })
  following: User[];

  @ApiHideProperty()
  @OneToMany(() => UserToBlock, (utb) => utb.blocker)
  blockers: UserToBlock[];

  @ApiHideProperty()
  @OneToMany(() => UserToBlock, (utb) => utb.blockedUser)
  blockedUsers: UserToBlock[];

  @ApiHideProperty()
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @ApiHideProperty()
  @OneToMany(() => Notification, (notification) => notification.viewer)
  receiveNotifications: Notification[];

  @ApiHideProperty()
  @OneToMany(() => Notification, (notification) => notification.viewer)
  sendNotifications: Notification[];

  @ApiHideProperty()
  @ManyToMany(() => Post, (post) => post.likers)
  likePosts: Post[];

  @OneToOne(() => UserCount, (c) => c.user, { cascade: ['insert'] })
  userCount: UserCount;

  @ApiHideProperty()
  @OneToMany(() => PostReport, (report) => report.post)
  reports: PostReport[];

  @ApiHideProperty()
  @OneToMany(() => PostToStock, (ps) => ps.user, { cascade: ['insert'] })
  postToStocks: PostToStock[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @ApiProperty({ type: 'boolean' })
  @Expose({ name: 'isFollowing' })
  isFollowing() {
    return this.followers?.length > 0;
  }

  async checkPassword(passwordInput: string): Promise<boolean> {
    const ok = await bcrypt.compare(passwordInput, this.password);
    if (!ok) {
      throw new BadRequestException(CustomError.INVALID_PASSWORD);
    }
    return ok;
  }

  toJwtPayload(): JwtPayload {
    return {
      id: this.id,
      email: this.email,
      nickname: this.nickname,
    };
  }
}
