import type { UserRole } from '../types/auth.types';

// Where each role lands after login / when redirected away from a route
// that isn't theirs.
export const roleHome: Record<UserRole, string> = {
  ADMIN: '/',
  STAFF: '/staff',
  TRANSPORTATION: '/transport',
};
