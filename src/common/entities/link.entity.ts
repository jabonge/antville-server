import { ApiHideProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Link {
  @ApiHideProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  ogSiteName: string;

  @Column({ nullable: true })
  ogImage: string;

  @Column({ nullable: true })
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
}
