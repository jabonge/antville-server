import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum BlockType {
  BLOCKING = 'BLOCKING',
  BLOCKED = 'BLOCKED',
}

@Entity({ name: 'user_to_block' })
@Index(['blockerId', 'blockedId'], { unique: true })
export class UserToBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  blockerId: number;

  @Column()
  blockedId: number;

  @Column({
    default: 'BLOCKING',
    type: 'enum',
    enum: BlockType,
  })
  blockType: BlockType;

  @ManyToOne(() => User, (user) => user.blockers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockerId' })
  blocker: User;

  @ManyToOne(() => User, (user) => user.blockedUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockedId' })
  blockedUser: User;
}
