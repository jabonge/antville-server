import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class GifImage {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'double' })
  ratio: number;

  @Column()
  gifUrl: string;

  @Column()
  tinyGifUrl: string;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;
}
