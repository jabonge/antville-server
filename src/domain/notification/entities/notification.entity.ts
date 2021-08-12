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
  POST_COMMENT = 'POST_COMMENT',
  COMMENT_COMMENT = 'COMMENT_COMMENT',
  COMMENT_TAG = 'COMMENT_TAG',
  COMMENT_LIKE = 'COMMENT_LIKE',
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

  @Column({ type: 'int', nullable: true, select: false })
  viewerId: number;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'viewerId',
  })
  viewer: User;

  @Column({ type: 'int', select: false })
  senderId: number;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    cascade: ['insert'],
  })
  @JoinColumn({
    name: 'senderId',
  })
  sender: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;
}
