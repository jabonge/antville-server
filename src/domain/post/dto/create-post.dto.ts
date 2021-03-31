import { Sentiment } from '../entities/post.entity';

export class CreatePostDto {
  postId?: number;
  body: string;
  gifId: string;
  tinyGifUrl: string;
  gifUrl: string;
  ratio: number;
  sentiment?: Sentiment;
}
