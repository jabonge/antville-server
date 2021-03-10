import { Column, Entity, JoinColumn, OneToOne, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Stock } from './stock.entity';

@Entity()
export class StockMeta extends CoreEntity {
  symbol!: string;

  @Column({
    type: 'double',
  })
  latest!: number;

  @Column({
    type: 'double',
    nullable: true,
  })
  marketCap!: number;

  @Column({
    type: 'double',
    nullable: true,
  })
  dayLow!: number;

  @Column({
    type: 'double',
    nullable: true,
  })
  dayHigh!: number;

  @Column({
    type: 'double',
    nullable: true,
  })
  open!: number;

  @Column({
    type: 'double',
    nullable: true,
  })
  previousClose!: number;

  @Column({
    type: 'timestamp',
  })
  timestamp!: Date;

  @RelationId((stockMeta: StockMeta) => stockMeta.stock)
  stockId!: number;

  @OneToOne(() => Stock, (stock) => stock.stockMeta, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  stock!: Stock;
}
