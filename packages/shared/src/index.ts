export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  status: "online" | "dnd" | "offline";
  notifyMentionsOnly: boolean;
}

export interface ChannelMemberDto {
  id: string;
  nickName: string;
  firstName: string;
  lastName: string;
  status: UserDto['status'];
  role: "owner" | "member";
}

export interface ChannelDto {
  id: string;
  name: string;
  type: "public" | "private";
  ownerId: string;
  members: ChannelMemberDto[];
  lastActivityAt: string | null;
  membershipStatus: "active" | "invited";
  isOwner: boolean;
  unreadCount: number;
  highlightedUntil: string | null;
}

export interface MessageDto {
  id: string;
  channelId: string;
  senderId: string;
  sender: string;
  content: string;
  createdAt: string;
  addressedTo?: string;
}

export interface CommandResultDto {
  success: boolean;
  feedback: string;
  channel?: ChannelDto;
  members?: ChannelMemberDto[];
}

export interface TypingStateDto {
  userId: string;
  nickName: string;
  contentPreview: string;
  updatedAt: string;
}
