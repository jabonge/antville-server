import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Stock } from './stock.entity';

@Entity()
export class StockCount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unsigned: true,
    default: 0,
  })
  watchUserCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @Column({ type: 'int', nullable: true, select: false })
  stockId: number | null;

  @OneToOne(() => Stock, (s) => s.stockCount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stockId' })
  stock: Stock;
}
