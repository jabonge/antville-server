import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsValidNickname(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidNickname',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _: ValidationArguments) {
          return checkNicknameLength(value) && nicknameRegex.test(value);
        },
      },
    });
  };
}

const nicknameRegex = /^(?!.*\.\.)(?!.*\.$)[0-9a-zA-Z_가-힣][a-zA-Z0-9_.가-힣]{1,27}$/;

const checkNicknameLength = (nickname: string) => {
  let nickLength = 0;
  for (let i = 0; i < nickname.length; i++) {
    const nick = nickname.charAt(i);
    if (escape(nick).length > 4) {
      nickLength += 2;
    } else {
      nickLength += 1;
    }
  }
  if (nickLength >= 3 && nickLength <= 29) {
    return true;
  } else {
    return false;
  }
};
