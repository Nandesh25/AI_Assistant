import { UserPublic } from './user.model';

export type ChatType = 'direct' | 'group';
export type MemberRole = 'member' | 'admin';

export interface ChatMember {
  id: number;
  user_id: number;
  role: MemberRole;
  user: UserPublic | null;
}

export interface Chat {
  id: number;
  type: ChatType;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: number | null;
  created_at: string;
  members: ChatMember[];
}
