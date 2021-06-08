import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Comment } from './comment.entity';

@Entity()
export class CommentImg {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  image: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @RelationId((img: CommentImg) => img.comment)
  commentId: number;

  @ManyToOne(() => Comment, (comment) => comment.commentImgs, {
    onDelete: 'SET NULL',
  })
  comment: Comment;
}
