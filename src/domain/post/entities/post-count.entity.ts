import { CoreEntity } from './../../../common/entities/core.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class PostCount extends CoreEntity {
  @Column({
    type: 'int',
    default: 0,
  })
  likeCount: number;

  @Column({
    type: 'int',
    default: 0,
  })
  commentCount: number;
}
