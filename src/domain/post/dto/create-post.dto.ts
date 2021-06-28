import { IsNotEmpty, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { Sentiment } from '../entities/post.entity';

export class CreatePostDto {
  @MaxLength(1000)
  @IsNotEmpty()
  body: string;
  @IsOptional()
  gif?: string;
  @IsOptional()
  @IsEnum(Sentiment)
  sentiment?: Sentiment;
}
