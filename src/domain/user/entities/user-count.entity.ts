import { CoreEntity } from '../../../common/entities/core.entity';
import { Column, Entity } from 'typeorm';

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
}
