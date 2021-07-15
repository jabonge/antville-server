import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @MaxLength(1000)
  @IsNotEmpty()
  body: string;
  @IsNumberString()
  postId: string;
  @IsOptional()
  gif?: string;
  @IsOptional()
  @IsNumberString()
  parentCommentId?: string;
}
