import { LexoRank } from 'lexorank';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Stock } from '../../stock/entities/stock.entity';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'watchlist' })
@Unique(['userId', 'stockId'])
export class WatchList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  stockId: number;

  @Column({
    length: 1000,
    default: LexoRank.middle().toString(),
  })
  lexorank: string;

  @ManyToOne(() => User, (user) => user.watchStocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Stock, (stock) => stock.watchUsers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stockId' })
  stock: Stock;
}
