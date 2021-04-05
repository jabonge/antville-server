const CustomError = {
  //600 번대 auth 관련;
  DUPLICATED_EMAIL: {
    errorCode: 600,
    message: 'Email is duplicated',
  },
  DUPLICATED_NICKNAME: {
    errorCode: 601,
    message: 'Nickname is duplicated',
  },
  EMAIL_NOT_FOUND: {
    errorCode: 602,
    message: 'Email is not exist',
  },
  INVALID_PASSWORD: {
    errorCode: 603,
    message: 'Invalid Password',
  },
};

export default CustomError;
