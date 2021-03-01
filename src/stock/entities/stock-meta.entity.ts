import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, OneToOne, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Stock } from './stock.entity';

@ObjectType()
@Entity()
export class StockMeta extends CoreEntity {
  @Field(() => String)
  symbol!: string;

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
}
