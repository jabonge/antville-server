export class CreateCommentDto {
  body: string;
  postId: number;
  gif?: string;
  parentCommentId?: number;
}
