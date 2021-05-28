import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Exclude, Expose } from 'class-transformer';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Link } from '../../../common/entities/link.entity';
import { GifImage } from '../../../common/entities/gif.entity';
import { CommentImg } from './comment-img.entity';
import { CommentCount } from './comment-count.entity';
import { CommentReport } from './comment-report.entity';
import { Post } from '../../post/entities/post.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 1000,
  })
  body: string;

  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @OneToMany(() => CommentImg, (img) => img.comment, { cascade: ['insert'] })
  commentImgs: CommentImg[];

  @OneToMany(() => CommentReport, (report) => report.comment)
  reports: CommentReport[];

  @Column({ type: 'int' })
  postId: number;

  @ApiHideProperty()
  @ManyToOne(() => Post, (p) => p.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ type: 'int', nullable: true })
  parentCommentId: number;

  @ApiHideProperty()
  @ManyToOne(() => Comment, (c) => c.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment: Comment;

  @ApiHideProperty()
  @OneToMany(() => Comment, (c) => c.parentComment)
  comments: Comment[];

  @ApiHideProperty()
  @Exclude()
  @Column({ nullable: true, select: false })
  linkId: string;

  @ManyToOne(() => Link, { cascade: ['insert'] })
  @JoinColumn({ name: 'linkId' })
  link?: Link;

  @ApiHideProperty()
  @Exclude()
  @Column({ nullable: true, select: false })
  gifId: string;

  @ManyToOne(() => GifImage, { cascade: ['insert'] })
  @JoinColumn({ name: 'gifId' })
  gifImage?: GifImage;

  @ApiHideProperty()
  @ManyToMany(() => User, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'comments_likers',
    joinColumn: {
      name: 'commentId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  @Exclude()
  likers: User[];

  @ApiHideProperty()
  @Column({ type: 'int', nullable: true, select: false })
  authorId: number | null;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToOne(() => CommentCount, (c) => c.comment, { cascade: ['insert'] })
  commentCount: CommentCount;

  @ApiProperty({ type: 'boolean' })
  @Expose({ name: 'isLikedSelf' })
  isLikedSelf() {
    return this.likers?.length === 1;
  }
}
