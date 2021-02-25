import { Stock } from './../../stock/entities/stock.entity';
import { CoreEntity } from './../../common/entities/core.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Index, JoinTable, ManyToMany, Entity } from 'typeorm';

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
}
