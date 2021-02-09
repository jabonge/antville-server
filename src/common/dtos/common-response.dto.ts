import { Type } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';

// @ObjectType()
// export class CommonResponse<> {
//   @Field(() => String, { nullable: true })
//   error?: string;

//   @Field(() => Boolean)
//   ok: boolean;

//   @Field(() => T, { nullable: true })
//   data?: T;
// }

export function CommonResponse<T>(classRef?: Type<T>, isArray = false): any {
  @ObjectType({ isAbstract: true })
  abstract class CommonResponseType {
    @Field(() => String, { nullable: true })
    error?: string;

    @Field(() => Boolean)
    ok: boolean;

    @Field(() => (isArray ? [classRef] : classRef), { nullable: true })
    data?: T;
  }
  return CommonResponseType;
}
