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
import { Comment } from './comment.entity';

@Entity()
export class CommentImg {
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
  @RelationId((img: CommentImg) => img.comment)
  commentId: number;

  @ApiHideProperty()
  @ManyToOne(() => Comment, (comment) => comment.commentImgs, {
    onDelete: 'SET NULL',
  })
  comment: Comment;
}
