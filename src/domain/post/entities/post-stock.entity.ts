import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Stock } from '../../stock/entities/stock.entity';
import { User } from '../../user/entities/user.entity';
import { Post } from './post.entity';

@Entity({ name: 'post_to_stock' })
export class PostToStock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  postId: number;

  @Column()
  stockId: number;

  @Column()
  authorId: number;

  @ManyToOne(() => Post, (post) => post.postToStocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ManyToOne(() => Stock, (stock) => stock.postToStocks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stockId' })
  stock: Stock;

  @ManyToOne(() => User, (user) => user.postToStocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  user: User;
}
