import { Country } from './country.entity';
import { Stock } from './stock.entity';
import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';

@ObjectType()
@Entity()
export class Exchange {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id!: number;

  @Field(() => String)
  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
  })
  name!: string;

  @Field(() => [Stock])
  @OneToMany(() => Stock, (stock) => stock.exchange)
  stocks!: Stock[];

  @RelationId((exchange: Exchange) => exchange.country)
  countryId!: number;

  @ManyToOne(() => Country, {
    onDelete: 'CASCADE',
  })
  country!: Country;
}
