import { PostLink } from './link.entity';
import { PostImg } from './post-img.entity';
import {
  Column,
  Entity,
  JoinColumn,
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
  body!: string;

  @Column({
    nullable: true,
  })
  giphyId!: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: Sentiment,
  })
  sentiment!: Sentiment;

  @OneToMany(() => PostImg, (img) => img.post)
  postImgs!: PostImg[];

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  post!: Post;

  @OneToMany(() => Post, (p) => p.post)
  comments!: Post[];

  @OneToOne(() => PostLink, { onDelete: 'CASCADE' })
  @JoinColumn()
  link!: PostLink;

  @ManyToMany(() => User)
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
  likers!: User[];

  @ManyToOne(() => User, (user) => user.posts)
  author!: User;

  @ManyToMany(() => Stock, (stock) => stock.posts)
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
  stocks!: Stock[];

  @OneToOne(() => PostCount, { onDelete: 'CASCADE' })
  @JoinColumn()
  postCount!: PostCount;
}
