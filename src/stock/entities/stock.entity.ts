import { Country } from './country.entity';
import { StockMeta } from './stock-meta.entity';
import { Exchange } from './exchange.entity';
import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  RelationId,
} from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';

export enum StockType {
  ETF = 'ETF',
  CRYPTO = 'CRYPTO',
}

registerEnumType(StockType, { name: 'StockType' });

@ObjectType()
@Entity()
@Index(['enName', 'krName'], { fulltext: true, parser: 'NGRAM' })
export class Stock extends CoreEntity {
  @Field(() => String)
  @Index({ fulltext: true })
  @Column({
    length: 12,
  })
  symbol!: string;

  @Field(() => String)
  @Column({
    length: 200,
  })
  enName!: string;

  @Field(() => String)
  @Column({
    length: 200,
  })
  krName!: string;

  @Field(() => StockType, { nullable: true })
  @Column({
    nullable: true,
    type: 'enum',
    enum: StockType,
  })
  type!: StockType;

  @Field(() => StockMeta, { nullable: true })
  @OneToOne(() => StockMeta, (stockMeta) => stockMeta.stock, {
    onDelete: 'CASCADE',
  })
  stockMeta!: StockMeta;

  @RelationId((stock: Stock) => stock.exchange)
  exchangeId!: number;

  @Field(() => Exchange, { nullable: true })
  @ManyToOne(() => Exchange, (exchange) => exchange.stocks)
  exchange!: Exchange;

  @RelationId((stock: Stock) => stock.country)
  countryId!: number;

  @Field(() => Country, { nullable: true })
  @ManyToOne(() => Country)
  country!: Country;
}
