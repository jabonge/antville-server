import { ApiHideProperty } from '@nestjs/swagger';
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
export class PostLink {
  @ApiHideProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ogSiteName: string;

  @Column()
  ogImage: string;

  @Column()
  ogTitle: string;

  @Column()
  ogDescription: string;

  @Column()
  ogUrl: string;

  @ApiHideProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ApiHideProperty()
  @OneToOne(() => Post, (post) => post.link, { onDelete: 'CASCADE' })
  @JoinColumn()
  post: Post;
}
