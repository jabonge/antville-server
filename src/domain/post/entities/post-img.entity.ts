import { Post } from './post.entity';

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PostImg {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  image: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @RelationId((img: PostImg) => img.post)
  postId: number;

  @ManyToOne(() => Post, (post) => post.postImgs, { onDelete: 'SET NULL' })
  post: Post;
}
