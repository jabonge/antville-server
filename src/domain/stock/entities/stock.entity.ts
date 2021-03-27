import { Country } from './country.entity';
import { StockMeta } from './stock-meta.entity';
import { Exchange } from './exchange.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../../post/entities/post.entity';
import { StockCount } from './stock-count.entity';
import { ApiHideProperty } from '@nestjs/swagger';

export enum StockType {
  ETF = 'ETF',
  CRYPTO = 'CRYPTO',
}

@Entity()
@Index(['enName', 'krName'], { fulltext: true, parser: 'NGRAM' })
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
  @RelationId((stock: Stock) => stock.country)
  countryId: number;

  @ApiHideProperty()
  @ManyToOne(() => Country)
  country: Country;

  @ApiHideProperty()
  @ManyToMany(() => Post, (post) => post.stocks)
  posts: Post[];

  @OneToOne(() => StockCount, (c) => c.stock, { cascade: ['insert'] })
  stockCount?: StockCount;
}
