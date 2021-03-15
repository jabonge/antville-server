import { Post } from './post.entity';

import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CoreEntity } from './../../../common/entities/core.entity';

@Entity()
export class PostImg extends CoreEntity {
  @Column()
  image!: string;

  @RelationId((img: PostImg) => img.post)
  postId!: number;

  @ManyToOne(() => Post, (post) => post.postImgs, { onDelete: 'SET NULL' })
  post!: Post;
}
