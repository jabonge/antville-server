import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Country {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @Column({
    unique: true,
  })
  code!: string;

  @Field(() => String)
  @Column()
  krName!: string;

  @Field(() => String)
  @Column()
  usName!: string;
}
