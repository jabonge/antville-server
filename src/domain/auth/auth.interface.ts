export interface JwtPayload {
  id: number;
  email: string;
  nickname: string;
}

export interface FindPasswordPayload {
  userId: number;
  tempPassword: string;
}

export interface VerifyEmailPayload {
  userId: number;
}
