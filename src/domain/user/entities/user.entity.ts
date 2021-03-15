import { JwtPayload } from '../../auth/auth.interface';
import { Stock } from '../../stock/entities/stock.entity';
import { CoreEntity } from '../../../common/entities/core.entity';
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
  JoinColumn,
} from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Post } from '../../post/entities/post.entity';
import { UserCount } from './user-count.entity';

@Entity()
export class User extends CoreEntity {
  @Column({
    length: 20,
  })
  name!: string;

  @Index({ fulltext: true, parser: 'NGRAM' })
  @Column({
    length: 30,
  })
  nickname!: string;

  @Column()
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ select: false, nullable: true })
  refreshToken!: string;

  @Column({
    nullable: true,
  })
  bio!: string;

  @Column({
    nullable: true,
  })
  profileImg!: string;

  @ManyToMany(() => Stock)
  @JoinTable({
    name: 'watchlist',
  })
  stocks!: Stock[];

  @ManyToMany(() => User, (user) => user.following)
  @JoinTable({
    name: 'follow',
    joinColumn: {
      name: 'followerId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'follwingId',
      referencedColumnName: 'id',
    },
  })
  followers!: User[];

  @ManyToMany(() => User, (user) => user.followers)
  following!: User[];

  @OneToMany(() => Post, (post) => post.author)
  posts!: Post[];

  @OneToOne(() => UserCount, { onDelete: 'CASCADE' })
  @JoinColumn()
  userCount!: UserCount;

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
