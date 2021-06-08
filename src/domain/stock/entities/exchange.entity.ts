import { Stock } from './stock.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Exchange {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  countryCode: string;

  @OneToMany(() => Stock, (stock) => stock.exchange)
  stocks: Stock[];
}
