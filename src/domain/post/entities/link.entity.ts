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

  @Column({ nullable: true })
  ogSiteName: string;

  @Column({ nullable: true })
  ogImage: string;

  @Column()
  ogTitle: string;

  @Column({ nullable: true })
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
