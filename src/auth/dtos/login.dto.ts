import { CommonResponse } from './../../common/dtos/common-response.dto';
import { User } from './../../user/entities/user.entity';
import { InputType, ObjectType, PickType, Field } from '@nestjs/graphql';

@ObjectType()
class LoginDataType {
  @Field(() => String)
  accessToken: string;
  @Field(() => String)
  refreshToken: string;
}

@InputType()
export class LoginInput extends PickType(
  User,
  ['email', 'password'],
  InputType,
) {}

@ObjectType()
export class LoginResponse extends CommonResponse {
  @Field(() => LoginDataType)
  data: LoginDataType;
}
