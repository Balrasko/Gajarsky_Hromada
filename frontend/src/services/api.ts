import axios from 'axios';

import type {
  ChannelDto,
  ChannelMemberDto,
  CommandResultDto,
  MessageDto,
  TypingStateDto,
  UserDto,
} from '@vpwa/shared';

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

const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
});

const unwrap = <T>(value: T) => value;

export const registerUser = async (payload: RegisterPayload): Promise<UserDto> => {
  const { data } = await api.post<{ user: UserDto }>('/auth/register', payload);
  return unwrap(data.user);
};

export const loginUser = async (payload: LoginPayload): Promise<UserDto> => {
  const { data } = await api.post<{ user: UserDto }>('/auth/login', payload);
  return unwrap(data.user);
};

export const fetchUsers = async (): Promise<UserDto[]> => {
  const { data } = await api.get<{ users: UserDto[] }>('/users');
  return unwrap(data.users);
};

export const fetchChannels = async (userId: string): Promise<ChannelDto[]> => {
  const { data } = await api.get<{ channels: ChannelDto[] }>('/channels', {
    params: { userId },
  });
  return unwrap(data.channels);
};

export const fetchChannelMembers = async (
  channelId: string,
  userId: string,
): Promise<{ members: ChannelMemberDto[]; feedback?: string }> => {
  const { data } = await api.get<{ members: ChannelMemberDto[]; feedback?: string }>(
    `/channels/${channelId}/members`,
    {
      params: { userId },
    },
  );
  return data;
};

export const leaveChannelRequest = async (
  channelId: string,
  userId: string,
): Promise<{ feedback?: string }> => {
  const { data } = await api.post<{ feedback?: string }>(`/channels/${channelId}/leave`, {
    userId,
  });
  return data;
};

export const fetchChannelMessages = async (
  channelId: string,
  userId: string,
  cursor?: string,
  limit = 30,
): Promise<{ messages: MessageDto[]; nextCursor: string | null }> => {
  const { data } = await api.get<{ messages: MessageDto[]; nextCursor: string | null }>(
    `/channels/${channelId}/messages`,
    {
      params: { userId, cursor, limit },
    },
  );

  return data;
};

export const sendChannelMessage = async (
  channelId: string,
  userId: string,
  content: string,
): Promise<MessageDto> => {
  const { data } = await api.post<{ message: MessageDto }>(`/channels/${channelId}/messages`, {
    userId,
    content,
  });
  return data.message;
};

export const executeCommand = async (
  userId: string,
  command: string,
  channelId?: string,
): Promise<CommandResultDto> => {
  const { data } = await api.post<{ result: CommandResultDto }>('/commands', {
    userId,
    command,
    channelId,
  });

  return data.result;
};

export const updateTypingState = async (
  channelId: string,
  userId: string,
  content: string,
) => {
  await api.post(`/channels/${channelId}/typing`, { userId, content });
};

export const fetchTypingStates = async (
  channelId: string,
  userId: string,
): Promise<TypingStateDto[]> => {
  const { data } = await api.get<{ typing: TypingStateDto[] }>(`/channels/${channelId}/typing`, {
    params: { userId },
  });
  return data.typing;
};
