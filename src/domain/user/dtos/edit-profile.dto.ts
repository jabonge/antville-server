import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsValidNickname } from '../../../infra/decorators/nickname.decorator';

export class EditProfileDto {
  @IsOptional()
  @IsNotEmpty()
  @IsValidNickname({
    message: '유효하지 않은 닉네임 입니다.',
  })
  nickname?: string;
  @IsOptional()
  bio?: string;
}
