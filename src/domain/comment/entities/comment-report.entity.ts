import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Comment } from './comment.entity';

@Entity()
export class CommentReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  commentId: number;

  @Column({ type: 'int', nullable: true })
  userId?: number;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
