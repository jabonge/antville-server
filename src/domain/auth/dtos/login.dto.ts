export class LoginInputDto {
  email: string;
  password: string;
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
}
