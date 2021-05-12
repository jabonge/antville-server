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
  REFRESH_TOKEN_EXPIRED: {
    errorCode: 604,
    message: 'Refresh Token Expired',
  },
  INVALID_REFRESH_TOKEN: {
    errorCode: 605,
    message: 'Invalid Refresh Token',
  },
  // 700 번대 stock 관련
  WATCH_LIST_LIMIT_EXCEED: {
    errorCode: 700,
    message: 'Watchlist Limit is Exceeded',
  },
};

export default CustomError;
