import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { Stock } from '../../stock/entities/stock.entity';

@Entity()
export class PostStockPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'double',
  })
  price: number;

  @Column({ type: 'int', nullable: true, select: false })
  stockId: number | null;

  nowPrice?: number;

  @ManyToOne(() => Stock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockId' })
  stock: Stock;

  @Column({ type: 'int', nullable: true, select: false })
  postId: number | null;

  @OneToOne(() => Post, (p) => p.postStockPrice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;
}
