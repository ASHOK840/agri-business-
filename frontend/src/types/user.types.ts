import type { UserRole } from './auth.types';

// The Manage Users screen only ever creates/manages Staff and
// Transportation logins — never Admin.
export type ManagedRole = Extract<UserRole, 'STAFF' | 'TRANSPORTATION'>;

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: ManagedRole;
}
