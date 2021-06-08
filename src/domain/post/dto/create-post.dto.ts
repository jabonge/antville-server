import { Sentiment } from '../entities/post.entity';

export class CreatePostDto {
  body: string;
  gif?: string;
  sentiment?: Sentiment;
}
