import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;
  @IsNotEmpty()
  @IsString()
  changePassword: string;
}
