import { Sentiment } from '../entities/post.entity';

export class CreatePostDto {
  postId?: number;
  body: string;
  gifUrl?: string;
  sentiment?: Sentiment;
}
