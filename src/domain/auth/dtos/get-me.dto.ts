import { PickType } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export class GetMeResponseDto extends PickType(User, [
  'id',
  'email',
  'nickname',
  'profileImg',
  'bio',
  'website',
]) {}
