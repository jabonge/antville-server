import { CoreEntity } from './../../../common/entities/core.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class StockCount extends CoreEntity {
  @Column({
    type: 'int',
    default: 0,
  })
  watchUserCount: number;

  @Column({
    type: 'int',
    default: 0,
  })
  postCount: number;
}
