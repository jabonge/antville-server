import { ObjectType, Field, Float } from '@nestjs/graphql';
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

  @Field(() => Float, { nullable: true })
  @Column({
    type: 'double',
    nullable: true,
  })
  dayLow!: number;

  @Field(() => Float, { nullable: true })
  @Column({
    type: 'double',
    nullable: true,
  })
  dayHigh!: number;

  @Field(() => Float, { nullable: true })
  @Column({
    type: 'double',
    nullable: true,
  })
  open!: number;

  @Field(() => Float, { nullable: true })
  @Column({
    type: 'double',
    nullable: true,
  })
  previousClose!: number;

  @Field(() => String)
  @Column({
    type: 'timestamp',
  })
  timestamp!: Date;

  @RelationId((stockMeta: StockMeta) => stockMeta.stock)
  stockId!: number;

  @Field(() => Stock, { nullable: true })
  @OneToOne(() => Stock, (stock) => stock.stockMeta, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  stock!: Stock;
}
