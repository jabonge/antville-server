import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Country {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    unique: true,
  })
  code!: string;

  @Column()
  krName!: string;

  @Column()
  usName!: string;
}
