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

@Entity()
export class PostCount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unsigned: true,
    default: 0,
  })
  likeCount: number;

  @Column({
    unsigned: true,
    default: 0,
  })
  commentCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @Column({ type: 'int', nullable: true, select: false })
  postId: number | null;

  @OneToOne(() => Post, (p) => p.postCount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;
}
