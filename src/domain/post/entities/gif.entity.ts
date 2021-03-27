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
export class GifImage {
  @ApiHideProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  gifId: string;

  @Column({ type: 'double' })
  ratio: number;

  @Column()
  gifUrl: string;

  @Column()
  tinyGifUrl: string;

  @ApiHideProperty()
  @CreateDateColumn({ select: false })
  createdAt: Date;

  @ApiHideProperty()
  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ApiHideProperty()
  @OneToOne(() => Post, (post) => post.gifImage, { onDelete: 'CASCADE' })
  @JoinColumn()
  post: Post;
}
