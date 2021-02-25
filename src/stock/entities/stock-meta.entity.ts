import { IUpbitWsCryptoResponse } from './../../sync/redis/interface';
import { Quote } from './../../lib/financial-api/financial-api.interfaces';
import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, OneToOne, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Stock } from './stock.entity';

@ObjectType()
@Entity()
export class StockMeta extends CoreEntity {
  @Field(() => Float)
  @Column({
    type: 'double',
  })
  latest!: number;

  @Field(() => Float, { nullable: true })
  @Column({
    type: 'double',
    nullable: true,
  })
  marketCap!: number;

  @Field(() => Float)
  @Column({
    type: 'double',
  })
  dayLow!: number;

  @Field(() => Float)
  @Column({
    type: 'double',
  })
  dayHigh!: number;

  @Field(() => Float)
  @Column({
    type: 'double',
  })
  open!: number;

  @Field(() => Float)
  @Column({
    type: 'double',
  })
  previousClose!: number;

  @Field(() => Int)
  @Column({
    type: 'integer',
  })
  timestamp!: number;

  @RelationId((stockMeta: StockMeta) => stockMeta.stock)
  stockId!: number;

  @Field(() => Stock, { nullable: true })
  @OneToOne(() => Stock, (stock) => stock.stockMeta, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  stock!: Stock;

  quoteToStockMeta(quote: Quote) {
    this.dayHigh = quote.dayHigh;
    this.dayLow = quote.dayLow;
    this.latest = quote.price;
    this.previousClose = quote.previousClose;
    this.open = quote.open;
    this.marketCap = quote.marketCap;
    this.timestamp = quote.timestamp;
  }

  upbitWsCryptoResponseToStockMeta(crypto: IUpbitWsCryptoResponse) {
    this.dayHigh = crypto.high_price;
    this.dayLow = crypto.low_price;
    this.latest = crypto.trade_price;
    this.previousClose = crypto.prev_closing_price;
    this.open = crypto.opening_price;
    this.timestamp = crypto.timestamp;
  }
}
