import { StockMeta } from './stock-meta.entity';
import { Exchange } from './exchange.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { StockCount } from './stock-count.entity';

export enum StockType {
  ETF = 'ETF',
  CRYPTO = 'CRYPTO',
  INDEX = 'INDEX',
}

@Entity()
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({
    unique: true,
  })
  @Column({
    length: 12,
  })
  symbol: string;

  @Column({
    length: 200,
  })
  enName: string;

  @Column({
    length: 200,
  })
  @Index()
  krName: string;

  @Column({
    length: 200,
    nullable: true,
  })
  @Index()
  cashTagName: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: StockType,
  })
  type: StockType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @OneToOne(() => StockMeta, (stockMeta) => stockMeta.stock, {
    cascade: ['insert', 'update'],
  })
  stockMeta: StockMeta;

  @RelationId((stock: Stock) => stock.exchange)
  exchangeId: number;

  @ManyToOne(() => Exchange, (exchange) => exchange.stocks)
  exchange: Exchange;

  @OneToOne(() => StockCount, (c) => c.stock, { cascade: ['insert'] })
  stockCount?: StockCount;
}
