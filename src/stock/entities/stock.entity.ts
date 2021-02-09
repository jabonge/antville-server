import { StockMeta } from './stock-meta.entity';
import { Exchange } from './exchange.entity';
import { ObjectType, Field } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  RelationId,
} from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';

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

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  sector!: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  ipoDate!: Date;

  @Field(() => StockMeta, { nullable: true })
  @OneToOne(() => StockMeta, (stockMeta) => stockMeta.stock, {
    onDelete: 'CASCADE',
  })
  stockMeta!: StockMeta;

  @RelationId((stock: Stock) => stock.exchange)
  exchangeId!: number;

  @Field(() => Exchange, { nullable: true })
  @ManyToOne(() => Exchange, (exchange) => exchange.stocks, {
    onDelete: 'CASCADE',
  })
  exchange!: Exchange;
}
