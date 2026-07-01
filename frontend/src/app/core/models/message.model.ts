import { UserPublic } from './user.model';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface FileMeta {
  id: number;
  filename: string;
  content_type: string;
  size_bytes: number;
  storage_path: string;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  body: string | null;
  reply_to_id: number | null;
  forwarded_from_id: number | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  sender: UserPublic | null;
  files: FileMeta[];
}
