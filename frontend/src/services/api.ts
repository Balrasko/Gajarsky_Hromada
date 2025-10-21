import axios from 'axios';
import type {
  ChannelDto,
  ChannelMemberDto,
  CommandResultDto,
  MessageDto,
  TypingStateDto,
  UserDto
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

export const registerUser = async (payload: RegisterPayload) => {
  const response = await axios.post<{ user: UserDto }>('/api/auth/register', payload);
  return response.data.user;
};

export const loginUser = async (payload: LoginPayload) => {
  const response = await axios.post<{ user: UserDto }>('/api/auth/login', payload);
  return response.data.user;
};

export const logoutUser = async (userId: string) => {
  const response = await axios.post<{ user: UserDto }>('/api/auth/logout', { userId });
  return response.data.user;
};

export const fetchUsers = async () => {
  const response = await axios.get<{ users: UserDto[] }>('/api/users');
  return response.data.users;
};

export const fetchChannels = async (userId: string) => {
  const response = await axios.get<{ channels: ChannelDto[] }>('/api/channels', {
    params: { userId }
  });
  return response.data.channels;
};

export const executeCommand = async (userId: string, command: string, channelId?: string) => {
  const response = await axios.post<{ result: CommandResultDto }>('/api/commands', {
    userId,
    command,
    channelId
  });

  return response.data.result;
};

export const fetchMessages = async (userId: string, channelId: string, cursor?: string, limit = 30) => {
  const response = await axios.get<{ messages: MessageDto[]; nextCursor: string | null }>(
    `/api/channels/${channelId}/messages`,
    {
      params: {
        userId,
        cursor,
        limit
      }
    }
  );

  return response.data;
};

export const sendMessage = async (userId: string, channelId: string, content: string) => {
  const response = await axios.post<{ message: MessageDto }>(`/api/channels/${channelId}/messages`, {
    userId,
    content
  });

  return response.data.message;
};

export const leaveChannel = async (userId: string, channelId: string) => {
  const response = await axios.post<{ feedback: string }>(`/api/channels/${channelId}/leave`, {
    userId
  });

  return response.data.feedback;
};

export const fetchMembers = async (userId: string, channelId: string) => {
  const response = await axios.get<{ members: ChannelMemberDto[] }>(`/api/channels/${channelId}/members`, {
    params: { userId }
  });

  return response.data.members;
};

export const updateTypingState = async (userId: string, channelId: string, content: string) => {
  await axios.post(`/api/channels/${channelId}/typing`, {
    userId,
    content
  });
};

export const fetchTypingStates = async (userId: string, channelId: string) => {
  const response = await axios.get<{ typing: TypingStateDto[] }>(`/api/channels/${channelId}/typing`, {
    params: { userId }
  });

  return response.data.typing;
};
