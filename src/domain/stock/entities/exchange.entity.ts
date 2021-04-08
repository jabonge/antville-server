import { Stock } from './stock.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';

@Entity()
export class Exchange {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  countryCode: string;

  @ApiHideProperty()
  @OneToMany(() => Stock, (stock) => stock.exchange)
  stocks: Stock[];
}
