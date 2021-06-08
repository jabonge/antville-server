import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Stock } from '../../stock/entities/stock.entity';
import { User } from '../../user/entities/user.entity';
import { Post } from './post.entity';

@Entity({ name: 'stock_post' })
export class StockPost {
  @Column('int', { primary: true })
  postId: number;

  @Column('int', { primary: true })
  stockId: number;

  @Column()
  authorId: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ManyToOne(() => Stock, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stockId' })
  stock: Stock;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  user: User;
}
