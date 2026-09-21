import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfirmDialog } from '../components/common/ConfirmDialog';
import { IconTruck, IconLogOut } from '../components/common/icons';

interface TransportationLayoutProps {
  children: ReactNode;
}

// Same deliberately bare-bones shape as StaffLayout — Transportation only
// ever sees their own trips, so there's nothing to put in a menu.
const TransportationLayout = ({ children }: TransportationLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirmDialog();

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Log out?',
      message: 'You will need to log in again.',
      confirmLabel: 'Log out',
    });
    if (!confirmed) return;
    logout();
    navigate('/role');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-amber-700 text-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Link to="/transport" className="flex items-center gap-2 text-lg font-semibold">
            <IconTruck className="h-6 w-6 text-amber-200 shrink-0" />
            Transportation{user ? ` — ${user.name}` : ''}
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-400 px-4 py-2 text-sm font-medium hover:bg-amber-800"
          >
            <IconLogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">{children}</main>

      {confirmDialog}
    </div>
  );
};

export default TransportationLayout;
