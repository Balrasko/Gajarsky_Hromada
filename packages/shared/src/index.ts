export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  status: "online" | "dnd" | "offline";
}

export interface ChannelDto {
  id: string;
  name: string;
  type: "public" | "private";
  members: string[];
}

export interface MessageDto {
  id: string;
  channelId: string;
  sender: string;
  content: string;
  createdAt: string;
  addressedTo?: string;
}
