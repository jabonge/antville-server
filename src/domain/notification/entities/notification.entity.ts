import { ApiHideProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum NotificationType {
  COMMENT = 'COMMENT',
  TAG = 'TAG',
  LIKE = 'LIKE',
  FOLLOW = 'FOLLOW',
  STOCK = 'STOCK',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'int',
  })
  paramId: number;

  @Column()
  content: string;

  @Column({ nullable: true })
  image: string;

  @Column({
    type: 'bool',
    default: false,
  })
  isChecked: boolean;

  @ApiHideProperty()
  @Column({ type: 'int', nullable: true, select: false })
  viewerId: number;

  @ApiHideProperty()
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'viewerId',
  })
  viewer: User;

  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;
}
