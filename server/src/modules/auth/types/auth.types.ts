// src/modules/auth/types/auth.types.ts

import { IUser } from '../../../models';

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  address?: string;

  // Height/weight from frontend (can be string, we’ll parse in service)
  height?: number | string;
  weight?: number | string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  // IUser without password + comparePassword
  user?: Omit<IUser, 'password' | 'comparePassword'>;
}

// Use this if you want a simplified user type on frontend side
export interface User extends Omit<IUser, 'password' | 'comparePassword'> {
  id: string; // will map from Mongo _id / virtual id
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
