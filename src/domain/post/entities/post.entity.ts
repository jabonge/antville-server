import { PostLink } from './link.entity';
import { PostImg } from './post-img.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Stock } from '../../stock/entities/stock.entity';
import { PostCount } from './post-count.entity';
import { Exclude, Expose } from 'class-transformer';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

export enum Sentiment {
  UP = 'UP',
  DOWN = 'DOWN',
}

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 1000,
  })
  body: string;

  @Column({
    nullable: true,
  })
  gifUrl?: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: Sentiment,
  })
  sentiment: Sentiment;

  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @OneToMany(() => PostImg, (img) => img.post, { cascade: ['insert'] })
  postImgs: PostImg[];

  @ApiHideProperty()
  @Column({ type: 'int', nullable: true, select: false })
  postId: number;

  @ApiHideProperty()
  @ManyToOne(() => Post, (post) => post.comments)
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ApiHideProperty()
  @OneToMany(() => Post, (p) => p.post, { onDelete: 'CASCADE' })
  comments: Post[];

  @OneToOne(() => PostLink, (link) => link.post, { cascade: ['insert'] })
  link: PostLink;

  @ApiHideProperty()
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
  @Exclude()
  likers: User[];

  @ApiHideProperty()
  @Column({ type: 'int', nullable: true, select: false })
  authorId: number | null;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ApiHideProperty()
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

  @ApiProperty({ type: 'boolean' })
  @Expose({ name: 'isLikedSelf' })
  isLikedSelf() {
    return this.likers?.length === 1;
  }
}
