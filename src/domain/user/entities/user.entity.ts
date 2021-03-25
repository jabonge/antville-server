import { JwtPayload } from '../../auth/auth.interface';
import { Stock } from '../../stock/entities/stock.entity';
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
import { HttpException, HttpStatus } from '@nestjs/common';
import { Post } from '../../post/entities/post.entity';
import { UserCount } from './user-count.entity';
import { ApiHideProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({
    length: 20,
  })
  name: string;

  @Index({ fulltext: true, parser: 'NGRAM' })
  @Column({
    length: 30,
  })
  nickname: string;

  @Column()
  email: string;

  @ApiHideProperty()
  @Column({ select: false })
  password: string;

  @ApiHideProperty()
  @Column({ select: false, nullable: true })
  refreshToken: string;

  @Column({
    nullable: true,
  })
  bio?: string;

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
  @ManyToMany(() => Stock)
  @JoinTable({
    name: 'watchlist',
  })
  stocks: Stock[];

  @ApiHideProperty()
  @ManyToMany(() => User, (user) => user.following)
  followers: User[];

  @ApiHideProperty()
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
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @ApiHideProperty()
  @ManyToMany(() => Post, (post) => post.likers)
  likePosts: Post[];

  @OneToOne(() => UserCount, (c) => c.user, { cascade: ['insert'] })
  userCount?: UserCount;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async checkPassword(passwordInput: string): Promise<boolean> {
    const ok = await bcrypt.compare(passwordInput, this.password);
    if (!ok) {
      throw new HttpException('Invalid Password', HttpStatus.BAD_REQUEST);
    }
    return ok;
  }

  toJwtPayload(): JwtPayload {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
    };
  }
}