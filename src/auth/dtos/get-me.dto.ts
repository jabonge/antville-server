import { User } from './../../user/entities/user.entity';
import { ObjectType, PickType } from '@nestjs/graphql';

@ObjectType()
export class GetMeResponse extends PickType(User, [
  'id',
  'email',
  'nickname',
  'name',
  'profileImg',
  'bio',
]) {}
