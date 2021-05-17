import { ApiHideProperty } from '@nestjs/swagger';
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
  @ApiHideProperty()
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

  @ApiHideProperty()
  @CreateDateColumn({ select: false })
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ApiHideProperty()
  @RelationId((stockMeta: StockMeta) => stockMeta.stock)
  stockId: number;

  @ApiHideProperty()
  @OneToOne(() => Stock, (stock) => stock.stockMeta, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  stock: Stock;
}
