import { PostLink } from './link.entity';
import { PostImg } from './post-img.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CoreEntity } from './../../../common/entities/core.entity';
import { User } from '../../user/entities/user.entity';
import { Stock } from '../../stock/entities/stock.entity';
import { PostCount } from './post-count.entity';

export enum Sentiment {
  UP = 'UP',
  DOWN = 'DOWN',
}

@Entity()
export class Post extends CoreEntity {
  @Column({
    length: 1000,
  })
  body: string;

  @Column({
    nullable: true,
  })
  gifUrl: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: Sentiment,
  })
  sentiment: Sentiment;

  @OneToMany(() => PostImg, (img) => img.post, { cascade: ['insert'] })
  postImgs: PostImg[];

  @ManyToOne(() => Post, (post) => post.comments)
  post: Post;

  @OneToMany(() => Post, (p) => p.post, { onDelete: 'CASCADE' })
  comments: Post[];

  @OneToOne(() => PostLink, (link) => link.post, { cascade: ['insert'] })
  link: PostLink;

  @ManyToMany(() => User, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'posts_likers',
    joinColumn: {
      name: 'postId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  likers: User[];

  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @ManyToMany(() => Stock, (stock) => stock.posts, {
    onDelete: 'CASCADE',
    cascade: ['insert'],
  })
  @JoinTable({
    name: 'posts_stocks',
    joinColumn: {
      name: 'postId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'stockId',
      referencedColumnName: 'id',
    },
  })
  stocks: Stock[];

  @OneToOne(() => PostCount, (c) => c.post, { cascade: ['insert'] })
  postCount: PostCount;
}
