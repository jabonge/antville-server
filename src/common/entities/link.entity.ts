import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Link {
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;
}
