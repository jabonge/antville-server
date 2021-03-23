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
import { ApiHideProperty } from '@nestjs/swagger';

@Entity()
export class PostImg {
  @ApiHideProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  image: string;

  @ApiHideProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ApiHideProperty()
  @RelationId((img: PostImg) => img.post)
  postId: number;

  @ApiHideProperty()
  @ManyToOne(() => Post, (post) => post.postImgs, { onDelete: 'SET NULL' })
  post: Post;
}
