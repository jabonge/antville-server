import { Country } from './country.entity';
import { StockMeta } from './stock-meta.entity';
import { Exchange } from './exchange.entity';
import {
  Column,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  OneToOne,
  RelationId,
} from 'typeorm';
import { CoreEntity } from '../../../common/entities/core.entity';
import { Post } from '../../post/entities/post.entity';
import { StockCount } from './stock-count.entity';

export enum StockType {
  ETF = 'ETF',
  CRYPTO = 'CRYPTO',
}

@Entity()
@Index(['enName', 'krName'], { fulltext: true, parser: 'NGRAM' })
export class Stock extends CoreEntity {
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

  @OneToOne(() => StockMeta, (stockMeta) => stockMeta.stock)
  stockMeta: StockMeta;

  @RelationId((stock: Stock) => stock.exchange)
  exchangeId: number;

  @ManyToOne(() => Exchange, (exchange) => exchange.stocks)
  exchange: Exchange;

  @RelationId((stock: Stock) => stock.country)
  countryId: number;

  @ManyToOne(() => Country)
  country: Country;

  @ManyToMany(() => Post, (post) => post.stocks)
  posts: Post[];

  @OneToOne(() => StockCount, (c) => c.stock, { cascade: ['insert'] })
  stockCount: StockCount;
}
