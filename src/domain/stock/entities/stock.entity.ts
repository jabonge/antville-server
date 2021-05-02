import { StockMeta } from './stock-meta.entity';
import { Exchange } from './exchange.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { StockCount } from './stock-count.entity';
import { ApiHideProperty } from '@nestjs/swagger';
import { PostToStock } from '../../post/entities/post-stock.entity';

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
    nullable: true,
    type: 'enum',
    enum: StockType,
  })
  type: StockType;

  @ApiHideProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ApiHideProperty()
  @OneToOne(() => StockMeta, (stockMeta) => stockMeta.stock, {
    cascade: ['insert'],
  })
  stockMeta: StockMeta;

  @ApiHideProperty()
  @RelationId((stock: Stock) => stock.exchange)
  exchangeId: number;

  @ApiHideProperty()
  @ManyToOne(() => Exchange, (exchange) => exchange.stocks)
  exchange: Exchange;

  @ApiHideProperty()
  @OneToMany(() => PostToStock, (ps) => ps.post, { cascade: ['insert'] })
  postToStocks: PostToStock[];

  @OneToOne(() => StockCount, (c) => c.stock, { cascade: ['insert'] })
  stockCount?: StockCount;
}
