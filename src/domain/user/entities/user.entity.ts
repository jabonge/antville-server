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
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BadRequestException } from '@nestjs/common';

import { UserCount } from './user-count.entity';

import CustomError from '../../../util/constant/exception';
import { Exclude, Expose } from 'class-transformer';
import { UserBlock } from './user-block.entity';

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

  @Column({ select: false })
  password: string;

  @Column({ select: false, nullable: true })
  refreshToken: string;

  @Column({ select: false, nullable: true })
  fcmToken: string;

  @Column({
    default: true,
  })
  pushAlarm: boolean;

  @Column({
    default: false,
  })
  isEmailVerified: boolean;

  @Column({
    default: false,
  })
  subscribeNewsLetter: boolean;

  @Column({
    default: false,
  })
  wadizBadge: boolean;

  @Column({
    default: false,
  })
  influencerBadge: boolean;

  @Index()
  @Column({
    unsigned: true,
    nullable: true,
  })
  isRecommendUser: boolean;

  @Index()
  @Column({
    default: false,
  })
  isRecommendPostUser: boolean;

  @Column({
    default: false,
    select: false,
  })
  isBannded: boolean;

  @Column({
    nullable: true,
  })
  bio?: string;

  //deprecated soon
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

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @Exclude()
  @ManyToMany(() => User, (user) => user.following)
  followers: User[];

  @Exclude()
  @ManyToMany(() => User, (user) => user.followers)
  @JoinTable({
    name: 'follow',
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

  @OneToMany(() => UserBlock, (utb) => utb.blockedUser)
  blockedUsers: UserBlock[];

  @OneToOne(() => UserCount, (c) => c.user, { cascade: ['insert'] })
  userCount: UserCount;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  @Expose({ name: 'isFollowing' })
  isFollowing() {
    return this.followers?.length > 0;
  }

  async checkPassword(
    passwordInput: string,
    throwError = true,
  ): Promise<boolean> {
    const correct = await bcrypt.compare(passwordInput, this.password);
    if (!correct && throwError) {
      throw new BadRequestException(CustomError.INVALID_PASSWORD);
    }
    return correct;
  }

  toJwtPayload(): JwtPayload {
    return {
      id: this.id,
      email: this.email,
      nickname: this.nickname,
    };
  }
}
