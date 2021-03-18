import { CoreEntity } from './../../../common/entities/core.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Post } from './post.entity';

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

  @Column({ type: 'int', nullable: true, select: false })
  postId: number | null;

  @OneToOne(() => Post, (p) => p.postCount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;
}
