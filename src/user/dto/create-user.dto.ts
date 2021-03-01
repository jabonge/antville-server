import { User } from '../entities/user.entity';
import { InputType, PickType } from '@nestjs/graphql';

@InputType()
export class CreateUserInput extends PickType(
  User,
  ['email', 'password', 'name', 'nickname'],
  InputType,
) {}
