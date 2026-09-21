import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfirmDialog } from '../components/common/ConfirmDialog';
import { IconLeaf, IconLogOut } from '../components/common/icons';

interface StaffLayoutProps {
  children: ReactNode;
}

// Deliberately no sidebar, no menu, no module list — just a header with a
// name and a big logout button. Staff has exactly one job on this screen.
const StaffLayout = ({ children }: StaffLayoutProps) => {
  const { logout } = useAuth();
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
      <header className="bg-green-700 text-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Link to="/staff" className="flex items-center gap-2 text-lg font-semibold">
            <IconLeaf className="h-6 w-6 text-green-300 shrink-0" />
            Agri Business
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-green-500 px-4 py-2 text-sm font-medium hover:bg-green-800"
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

export default StaffLayout;
