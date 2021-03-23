import { ApiHideProperty } from '@nestjs/swagger';
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
  @ApiHideProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
    default: 0,
  })
  followers: number;

  @Column({
    type: 'int',
    default: 0,
  })
  following: number;

  @Column({
    type: 'int',
    default: 0,
  })
  postCount: number;

  @Column({
    type: 'int',
    default: 0,
  })
  watchStockCount: number;

  @Column({
    type: 'int',
    default: 0,
  })
  postLikeCount: number;

  @ApiHideProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ApiHideProperty()
  @Column({ type: 'int', nullable: true, select: false })
  userId: number | null;

  @ApiHideProperty()
  @OneToOne(() => User, (u) => u.userCount, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
  })
  user: User;
}
