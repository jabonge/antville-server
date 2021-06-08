import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Post } from './post.entity';

@Entity()
export class PostReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  postId: number;

  @Column({ type: 'int', nullable: true })
  userId?: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
