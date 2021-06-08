import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Stock } from './stock.entity';

@Entity()
export class StockMeta {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({
    type: 'double',
    nullable: true,
  })
  marketCap: number;

  @Index()
  @Column({
    type: 'int',
    nullable: true,
  })
  isPopular: number;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @RelationId((stockMeta: StockMeta) => stockMeta.stock)
  stockId: number;

  @OneToOne(() => Stock, (stock) => stock.stockMeta, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  stock: Stock;
}
