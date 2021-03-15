import { Stock } from './stock.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Exchange {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
  })
  name!: string;

  @OneToMany(() => Stock, (stock) => stock.exchange)
  stocks!: Stock[];
}
