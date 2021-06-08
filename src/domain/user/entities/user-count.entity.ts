import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserCount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unsigned: true,
    default: 0,
  })
  followers: number;

  @Column({
    unsigned: true,
    default: 0,
  })
  following: number;

  @Column({
    unsigned: true,
    default: 0,
  })
  postCount: number;

  @Column({
    unsigned: true,
    default: 0,
  })
  watchStockCount: number;

  @Column({
    unsigned: true,
    default: 0,
  })
  postLikeCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @Column({ type: 'int', nullable: true, select: false })
  userId: number | null;

  @OneToOne(() => User, (u) => u.userCount, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
  })
  user: User;
}
