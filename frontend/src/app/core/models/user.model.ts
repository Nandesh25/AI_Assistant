export type UserRole = 'user' | 'admin';

export interface Profile {
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  profile: Profile | null;
}

export interface UserPublic {
  id: number;
  username: string;
  profile: Profile | null;
}
