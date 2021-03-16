import { Sentiment } from '../entities/post.entity';

export class CreatePostDto {
  body: string;
  gifUrl?: string;
  sentiment?: Sentiment;
}
