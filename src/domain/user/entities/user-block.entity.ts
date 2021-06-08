import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum BlockType {
  BLOCKING = 'BLOCKING',
  BLOCKED = 'BLOCKED',
}

@Entity({ name: 'user_block' })
export class UserBlock {
  @Column('int', { primary: true })
  blockerId: number;

  @Column('int', { primary: true })
  blockedId: number;

  @Column({
    default: 'BLOCKING',
    type: 'enum',
    enum: BlockType,
  })
  blockType: BlockType;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockerId' })
  blocker: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blockedId' })
  blockedUser: User;
}
