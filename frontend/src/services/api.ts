import type {
  ChannelDto,
  ChannelMemberDto,
  CommandResultDto,
  MessageDto,
  TypingStateDto,
  UserDto,
} from '@vpwa/shared';

import { socketRequest } from './socket';

export interface ChannelCollections {
  channels: ChannelDto[];
  invites: ChannelDto[];
}

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

export const registerUser = async (payload: RegisterPayload): Promise<UserDto> => {
  const { user } = await socketRequest<{ user: UserDto }>('auth:register', payload);
  return user;
};

export const loginUser = async (payload: LoginPayload): Promise<UserDto> => {
  const { user } = await socketRequest<{ user: UserDto }>('auth:login', payload);
  return user;
};

export const fetchUsers = async (): Promise<UserDto[]> => {
  const { users } = await socketRequest<{ users: UserDto[] }>('users:list');
  return users;
};

export const fetchChannels = async (userId: string): Promise<ChannelCollections> => {
  const { channels, invites } = await socketRequest<{ channels: ChannelDto[]; invites: ChannelDto[] }>(
    'channels:list',
    { userId },
  );
  return { channels, invites: invites ?? [] };
};

export const fetchChannelMembers = async (
  channelId: string,
  userId: string,
): Promise<{ members: ChannelMemberDto[]; feedback?: string }> => {
  return socketRequest<{ members: ChannelMemberDto[]; feedback?: string }>('channels:members', {
    channelId,
    userId,
  });
};

export const leaveChannelRequest = async (
  channelId: string,
  userId: string,
): Promise<{ feedback?: string }> => {
  return socketRequest<{ feedback?: string }>('channels:leave', { channelId, userId });
};

export const fetchChannelMessages = async (
  channelId: string,
  userId: string,
  cursor?: string,
  limit = 30,
): Promise<{ messages: MessageDto[]; nextCursor: string | null }> => {
  return socketRequest<{ messages: MessageDto[]; nextCursor: string | null }>('channels:messages', {
    channelId,
    userId,
    cursor,
    limit,
  });
};

export const sendChannelMessage = async (
  channelId: string,
  userId: string,
  content: string,
): Promise<MessageDto> => {
  const { message } = await socketRequest<{ message: MessageDto }>('channels:message:send', {
    channelId,
    userId,
    content,
  });
  return message;
};

export const executeCommand = async (
  userId: string,
  command: string,
  channelId?: string,
): Promise<CommandResultDto> => {
  const { result } = await socketRequest<{ result: CommandResultDto }>('commands:execute', {
    userId,
    command,
    channelId,
  });

  return result;
};

export const updateTypingState = async (
  channelId: string,
  userId: string,
  content: string,
) => {
  await socketRequest('channels:typing:update', { channelId, userId, content });
};

export const fetchTypingStates = async (
  channelId: string,
  userId: string,
): Promise<TypingStateDto[]> => {
  const { typing } = await socketRequest<{ typing: TypingStateDto[] }>('channels:typing:list', {
    channelId,
    userId,
  });
  return typing;
};
