import { ApiHideProperty } from '@nestjs/swagger';
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
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  postId: number;

  @Column({ type: 'int', nullable: true })
  userId?: number;

  @ApiHideProperty()
  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ApiHideProperty()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
