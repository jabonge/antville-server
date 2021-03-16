import { CoreEntity } from './../../../common/entities/core.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Stock } from './stock.entity';

@Entity()
export class StockCount extends CoreEntity {
  @Column({
    type: 'int',
    default: 0,
  })
  watchUserCount: number;

  @Column({
    type: 'int',
    default: 0,
  })
  postCount: number;

  @OneToOne(() => Stock, (s) => s.stockCount, { onDelete: 'CASCADE' })
  @JoinColumn()
  stock: Stock;
}
