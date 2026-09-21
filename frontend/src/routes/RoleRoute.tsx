import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth.types';
import { roleHome } from './roleHome';

// Generic replacement for the old binary OwnerRoute/PrivateRoute split.
// Frontend route protection is for UX only — the real security boundary
// is enforced server-side (see backend authorize() middleware); this just
// keeps each role from ever seeing a screen that isn't theirs, and sends
// them to their own home instead of a dead end.
const RoleRoute = ({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/role" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;
