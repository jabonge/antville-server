import { CoreEntity } from '../../../common/entities/core.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserCount extends CoreEntity {
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

  @Column({ type: 'int', nullable: true, select: false })
  userId: number | null;

  @OneToOne(() => User, (u) => u.userCount, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'userId',
  })
  user: User;
}
