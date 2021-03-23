import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { ApiHideProperty } from '@nestjs/swagger';

@Entity()
export class PostCount {
  @ApiHideProperty()
  @PrimaryGeneratedColumn()
  id: number;

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

  @ApiHideProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ApiHideProperty()
  @Column({ type: 'int', nullable: true, select: false })
  postId: number | null;

  @ApiHideProperty()
  @OneToOne(() => Post, (p) => p.postCount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;
}
