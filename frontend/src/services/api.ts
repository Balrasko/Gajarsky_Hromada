import axios from 'axios';
import type { UserDto } from '@vpwa/shared';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const registerUser = async (payload: RegisterPayload) => {
  const response = await axios.post<{ user: UserDto }>('/api/auth/register', payload);
  return response.data.user;
};

export const loginUser = async (payload: LoginPayload) => {
  const response = await axios.post<{ user: UserDto }>('/api/auth/login', payload);
  return response.data.user;
};

export const fetchUsers = async () => {
  const response = await axios.get<{ users: UserDto[] }>('/api/users');
  return response.data.users;
};
