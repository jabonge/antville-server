import { StockPost } from './stock-post.entity';
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
import { Link } from '../../../common/entities/link.entity';
import { GifImage } from '../../../common/entities/gif.entity';
import { PostStockPrice } from './post-stock-price.entity';

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

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @OneToMany(() => PostImg, (img) => img.post, { cascade: ['insert'] })
  postImgs: PostImg[];

  @Column({ nullable: true, select: false })
  @Exclude()
  linkId: string;

  @ManyToOne(() => Link, { cascade: ['insert'] })
  @JoinColumn({ name: 'linkId' })
  link?: Link;

  @Column({ nullable: true, select: false })
  @Exclude()
  gifId: string;

  @ManyToOne(() => GifImage, { cascade: ['insert'] })
  @JoinColumn({ name: 'gifId' })
  gifImage?: GifImage;

  @ManyToMany(() => User, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'post_liker',
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

  @Column({ type: 'int', nullable: true, select: false })
  @Exclude()
  authorId: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany(() => StockPost, (sp) => sp.post, { cascade: ['insert'] })
  @Exclude()
  stockPosts: StockPost[];

  @OneToOne(() => PostCount, (c) => c.post, { cascade: ['insert'] })
  postCount: PostCount;

  @OneToOne(() => PostStockPrice, (c) => c.post, { cascade: ['insert'] })
  postStockPrice: PostStockPrice;

  @Expose({ name: 'isLikedSelf' })
  isLikedSelf() {
    return this.likers?.length === 1;
  }
}
