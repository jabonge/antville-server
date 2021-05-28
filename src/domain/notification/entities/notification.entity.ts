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
  TAG = 'TAG',
  LIKE = 'LIKE',
  FOLLOW = 'FOLLOW',
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

  @Column()
  param: string;

  @Column({
    type: 'bool',
    default: false,
  })
  isChecked: boolean;

  @ApiHideProperty()
  @Column({ type: 'int', nullable: true, select: false })
  viewerId: number;

  @ApiHideProperty()
  @ManyToOne(() => User, (user) => user.receiveNotifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'viewerId',
  })
  viewer: User;

  @ApiHideProperty()
  @Column({ type: 'int', select: false })
  senderId: number;

  @ApiHideProperty()
  @ManyToOne(() => User, (user) => user.sendNotifications, {
    onDelete: 'CASCADE',
    cascade: ['insert'],
  })
  @JoinColumn({
    name: 'senderId',
  })
  sender: User;

  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;
}
