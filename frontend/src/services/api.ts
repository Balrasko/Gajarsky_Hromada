import { uid } from 'quasar';
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

interface MockAccount extends UserDto {
  password: string;
}

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const seedUsers: MockAccount[] = [
  {
    id: 'mock-ada',
    firstName: 'Ada',
    lastName: 'Horváth',
    nickName: 'ada',
    email: 'ada@example.com',
    status: 'online',
    password: 'password',
  },
  {
    id: 'mock-ema',
    firstName: 'Ema',
    lastName: 'Nováková',
    nickName: 'ema',
    email: 'ema@example.com',
    status: 'dnd',
    password: 'password',
  },
  {
    id: 'mock-gab',
    firstName: 'Gabriel',
    lastName: 'Kováč',
    nickName: 'gabo',
    email: 'gabo@example.com',
    status: 'offline',
    password: 'password',
  },
];

const mockDatabase: MockAccount[] = [...seedUsers];

export const registerUser = async (payload: RegisterPayload) => {
  await delay();

  const nickTaken = mockDatabase.some(
    (account) => account.nickName.toLowerCase() === payload.nickName.toLowerCase(),
  );
  if (nickTaken) {
    throw new Error('NickName already used');
  }

  const emailTaken = mockDatabase.some(
    (account) => account.email.toLowerCase() === payload.email.toLowerCase(),
  );
  if (emailTaken) {
    throw new Error('Email already used');
  }

  const newAccount: MockAccount = {
    id: uid(),
    firstName: payload.firstName,
    lastName: payload.lastName,
    nickName: payload.nickName,
    email: payload.email,
    status: 'online',
    password: payload.password,
  };

  mockDatabase.push(newAccount);
  return {
    id: newAccount.id,
    firstName: newAccount.firstName,
    lastName: newAccount.lastName,
    nickName: newAccount.nickName,
    email: newAccount.email,
    status: newAccount.status,
  };
};

export const loginUser = async (payload: LoginPayload) => {
  await delay();

  const account = mockDatabase.find(
    (item) => item.email.toLowerCase() === payload.email.toLowerCase(),
  );

  if (!account || account.password !== payload.password) {
    throw new Error('Invalid credentials');
  }

  return {
    id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    nickName: account.nickName,
    email: account.email,
    status: account.status,
  };
};

export const fetchUsers = async () => {
  await delay(300);
  return mockDatabase.map<UserDto>((account) => {
    const { password: ignoredPassword, ...publicProfile } = account;
    void ignoredPassword;
    return publicProfile;
  });
};
