import type {
  ChannelDto,
  ChannelMemberDto,
  CommandResultDto,
  MessageDto,
  TypingStateDto,
  UserDto,
} from '@vpwa/shared';

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const defined = Object.entries(params).filter(([, value]) => value !== undefined && value !== null);
  return defined.length ? `?${new URLSearchParams(defined as [string, string][])}` : '';
};

const httpRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const message = (await response.text()) || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
};

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
  const { user } = await httpRequest<{ user: UserDto }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return user;
};

export const loginUser = async (payload: LoginPayload): Promise<UserDto> => {
  const { user } = await httpRequest<{ user: UserDto }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return user;
};

export const fetchUsers = async (): Promise<UserDto[]> => {
  const { users } = await httpRequest<{ users: UserDto[] }>('/api/users');
  return users;
};

export const fetchChannels = async (userId: string): Promise<ChannelCollections> => {
  const { channels, invites } = await httpRequest<{ channels: ChannelDto[]; invites: ChannelDto[] }>(
    `/api/channels${buildQuery({ userId })}`,
  );
  return { channels, invites: invites ?? [] };
};

export const fetchChannelMembers = async (
  channelId: string,
  userId: string,
): Promise<{ members: ChannelMemberDto[]; feedback?: string }> => {
  return httpRequest<{ members: ChannelMemberDto[]; feedback?: string }>(
    `/api/channels/${channelId}/members${buildQuery({ userId })}`,
  );
};

export const leaveChannelRequest = async (
  channelId: string,
  userId: string,
): Promise<{ feedback?: string }> => {
  return httpRequest<{ feedback?: string }>(`/api/channels/${channelId}/leave`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
};

export const fetchChannelMessages = async (
  channelId: string,
  userId: string,
  cursor?: string,
  limit = 30,
): Promise<{ messages: MessageDto[]; nextCursor: string | null }> => {
  return httpRequest<{ messages: MessageDto[]; nextCursor: string | null }>(
    `/api/channels/${channelId}/messages${buildQuery({ userId, cursor: cursor ?? undefined, limit })}`,
  );
};

export const sendChannelMessage = async (
  channelId: string,
  userId: string,
  content: string,
): Promise<MessageDto> => {
  // ostáva cez socket kvôli realtime broadcastu
  const { socketRequest } = await import('./socket');
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
  // nechávame na sockete, aby sa zachovali push udalosti (invite, join)
  const { socketRequest } = await import('./socket');
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
  const { socketRequest } = await import('./socket');
  await socketRequest('channels:typing:update', { channelId, userId, content });
};

export const fetchTypingStates = async (
  channelId: string,
  userId: string,
): Promise<TypingStateDto[]> => {
  const { typing } = await httpRequest<{ typing: TypingStateDto[] }>(
    `/api/channels/${channelId}/typing${buildQuery({ userId })}`,
  );
  return typing;
};
