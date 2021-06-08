import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Comment } from './comment.entity';

@Entity()
export class CommentCount {
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
  nextCommentCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @Column({ type: 'int', nullable: true, select: false })
  commentId: number | null;

  @OneToOne(() => Comment, (c) => c.commentCount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;
}
