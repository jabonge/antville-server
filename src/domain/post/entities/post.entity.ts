import { PostToStock } from './post-stock.entity';
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
import { PostCount } from './post-count.entity';
import { Exclude, Expose } from 'class-transformer';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { PostReport } from './post-report.entity';
import { Link } from '../../../common/entities/link.entity';
import { GifImage } from '../../../common/entities/gif.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { PostStockPrice } from './post-price.entity';

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

  @OneToMany(() => PostReport, (report) => report.post)
  reports: PostReport[];

  @ApiHideProperty()
  @OneToMany(() => Comment, (c) => c.post)
  comments: Comment[];

  @ApiHideProperty()
  @Column({ nullable: true, select: false })
  linkId: string;

  @ManyToOne(() => Link, { cascade: ['insert'] })
  @JoinColumn({ name: 'linkId' })
  link?: Link;

  @ApiHideProperty()
  @Column({ nullable: true, select: false })
  gifId: string;

  @ManyToOne(() => GifImage, { cascade: ['insert'] })
  @JoinColumn({ name: 'gifId' })
  gifImage?: GifImage;

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
  @OneToMany(() => PostToStock, (ps) => ps.post, { cascade: ['insert'] })
  postToStocks: PostToStock[];

  @OneToOne(() => PostCount, (c) => c.post, { cascade: ['insert'] })
  postCount: PostCount;

  @OneToOne(() => PostStockPrice, (c) => c.post, { cascade: ['insert'] })
  postStockPrice: PostStockPrice;

  @ApiProperty({ type: 'boolean' })
  @Expose({ name: 'isLikedSelf' })
  isLikedSelf() {
    return this.likers?.length === 1;
  }
}
