import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { ApiHideProperty } from '@nestjs/swagger';
import { Stock } from '../../stock/entities/stock.entity';

@Entity()
export class PostStockPrice {
  @ApiHideProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'double',
  })
  price: number;

  @ApiHideProperty()
  @Column({ type: 'int', nullable: true, select: false })
  stockId: number | null;

  nowPrice?: number;

  @ApiHideProperty()
  @ManyToOne(() => Stock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockId' })
  stock: Stock;

  @ApiHideProperty()
  @Column({ type: 'int', nullable: true, select: false })
  postId: number | null;

  @ApiHideProperty()
  @OneToOne(() => Post, (p) => p.postStockPrice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;
}
