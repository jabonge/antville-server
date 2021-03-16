import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { CoreEntity } from './../../../common/entities/core.entity';
import { Post } from './post.entity';
@Entity()
export class PostLink extends CoreEntity {
  @Column()
  ogSiteName: string;

  @Column()
  ogImage: string;

  @Column()
  ogTitle: string;

  @Column()
  ogDescription: string;

  @Column()
  ogUrl: string;

  @OneToOne(() => Post, (post) => post.link, { onDelete: 'CASCADE' })
  @JoinColumn()
  post: Post;
}
