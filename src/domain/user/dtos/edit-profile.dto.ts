import { IsNotEmpty, IsOptional } from 'class-validator';

export class EditProfileDto {
  @IsOptional()
  @IsNotEmpty()
  nickname?: string;
  @IsOptional()
  @IsNotEmpty()
  bio?: string;
  @IsOptional()
  @IsNotEmpty()
  website?: string;
}
