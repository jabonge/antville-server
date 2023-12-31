import { LexoRank } from 'lexorank';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Stock } from '../../stock/entities/stock.entity';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'watchlist' })
export class Watchlist {
  @Column('int', { primary: true })
  userId: number;

  @Column('int', { primary: true })
  stockId: number;

  @Column({
    length: 1000,
    default: LexoRank.middle().toString(),
  })
  lexorank: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Stock, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'stockId' })
  stock: Stock;
}
