import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiHideProperty } from '@nestjs/swagger';
import { Comment } from './comment.entity';

@Entity()
export class CommentCount {
  @ApiHideProperty()
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

  @ApiHideProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ApiHideProperty()
  @Column({ type: 'int', nullable: true, select: false })
  commentId: number | null;

  @ApiHideProperty()
  @OneToOne(() => Comment, (c) => c.commentCount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commentId' })
  comment: Comment;
}
