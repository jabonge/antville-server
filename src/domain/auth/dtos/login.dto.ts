import { PickType } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

export class LoginInputDto extends PickType(User, ['email', 'password']) {}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
}
