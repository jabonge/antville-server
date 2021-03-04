import { JwtPayload } from './../../auth/auth.interface';
import { Stock } from './../../stock/entities/stock.entity';
import { CoreEntity } from './../../common/entities/core.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import bcrypt from 'bcrypt';
import {
  Column,
  Index,
  JoinTable,
  ManyToMany,
  Entity,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';

@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Field(() => String)
  @Column({
    length: 20,
  })
  name!: string;

  @Field(() => String)
  @Index({ fulltext: true, parser: 'NGRAM' })
  @Column({
    length: 30,
  })
  nickname!: string;

  @Field(() => String)
  @Column()
  email!: string;

  @Field(() => String)
  @Column({ select: false })
  password!: string;

  @Field(() => String)
  @Column({ select: false })
  refreshToken!: string;

  @Field(() => String, { nullable: true })
  @Column({
    nullable: true,
  })
  bio!: string;

  @Field(() => String, { nullable: true })
  @Column({
    nullable: true,
  })
  profileImg!: string;

  @Field(() => [Stock], { nullable: true })
  @ManyToMany(() => Stock)
  @JoinTable({
    name: 'users_stocks',
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
  followers: User[];

  @ManyToMany(() => User, (user) => user.followers)
  following: User[];

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
