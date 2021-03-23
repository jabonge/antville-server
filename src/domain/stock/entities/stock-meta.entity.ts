import { ApiHideProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Stock } from './stock.entity';

@Entity()
export class StockMeta {
  @ApiHideProperty()
  @PrimaryGeneratedColumn()
  id: number;

  symbol: string;

  @Column({
    type: 'double',
  })
  latest: number;

  @Column({
    type: 'double',
    nullable: true,
  })
  marketCap: number;

  @Column({
    type: 'double',
    nullable: true,
  })
  dayLow: number;

  @Column({
    type: 'double',
    nullable: true,
  })
  dayHigh: number;

  @Column({
    type: 'double',
    nullable: true,
  })
  open: number;

  @Column({
    type: 'double',
    nullable: true,
  })
  previousClose: number;

  @Column({
    type: 'timestamp',
  })
  timestamp: Date;

  @ApiHideProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ApiHideProperty()
  @RelationId((stockMeta: StockMeta) => stockMeta.stock)
  stockId: number;

  @ApiHideProperty()
  @OneToOne(() => Stock, (stock) => stock.stockMeta, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  stock: Stock;
}
