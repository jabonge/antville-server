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
import { Link } from '../../../common/entities/link.entity';
import { GifImage } from '../../../common/entities/gif.entity';
import { CommentImg } from './comment-img.entity';
import { CommentCount } from './comment-count.entity';
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

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @OneToMany(() => CommentImg, (img) => img.comment, { cascade: ['insert'] })
  commentImgs: CommentImg[];

  @Column({ type: 'int' })
  postId: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ type: 'int', nullable: true })
  parentCommentId: number;

  @ManyToOne(() => Comment, (c) => c.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment: Comment;

  @OneToMany(() => Comment, (c) => c.parentComment)
  comments: Comment[];

  @Exclude()
  @Column({ nullable: true, select: false })
  linkId: string;

  @ManyToOne(() => Link, { cascade: ['insert'] })
  @JoinColumn({ name: 'linkId' })
  link?: Link;

  @Exclude()
  @Column({ nullable: true, select: false })
  gifId: string;

  @ManyToOne(() => GifImage, { cascade: ['insert'] })
  @JoinColumn({ name: 'gifId' })
  gifImage?: GifImage;

  @ManyToMany(() => User, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'comment_liker',
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

  @Column({ type: 'int', nullable: true, select: false })
  authorId: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToOne(() => CommentCount, (c) => c.comment, { cascade: ['insert'] })
  commentCount: CommentCount;

  @Expose({ name: 'isLikedSelf' })
  isLikedSelf() {
    return this.likers?.length === 1;
  }
}
