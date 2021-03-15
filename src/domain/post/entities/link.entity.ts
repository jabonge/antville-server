import { Column, Entity } from 'typeorm';
import { CoreEntity } from './../../../common/entities/core.entity';
@Entity()
export class PostLink extends CoreEntity {
  @Column()
  ogImage!: string;

  @Column()
  ogTitle!: string;

  @Column()
  ogDescription!: string;

  @Column()
  ogUrl!: string;

  @Column()
  requestUrl!: string;
}
