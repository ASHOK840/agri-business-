import type { ComponentType, ReactNode, SVGProps } from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfirmDialog } from '../components/common/ConfirmDialog';
import type { UserRole } from '../types/auth.types';
import {
  IconDashboard,
  IconUsers,
  IconBag,
  IconTruck,
  IconWallet,
  IconBoxes,
  IconLeaf,
  IconTag,
  IconBuilding,
  IconTrendingUp,
  IconCreditCard,
  IconReceipt,
  IconUserCircle,
  IconClipboardList,
  IconCheckCircle,
  IconSettings,
  IconFileBarChart,
  IconHistory,
  IconLogOut,
} from '../components/common/icons';

interface MainLayoutProps {
  children: ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  // Omitted = visible to every role that reaches this layout (MainLayout
  // is only ever rendered for ADMIN, but this stays explicit rather than
  // relying on that fact, per the reusable RoleRoute pattern).
  roles?: UserRole[];
}

interface NavGroup {
  heading: string;
  accent: keyof typeof groupDotColors;
  items: NavItem[];
}

// Matches the accent colors used on the Dashboard's own sections, so
// the sidebar and the dashboard read as one consistent color language
// rather than two unrelated designs.
const groupDotColors = {
  blue: 'bg-sky-500',
  amber: 'bg-amber-500',
  green: 'bg-green-600',
  purple: 'bg-purple-500',
  gray: 'bg-gray-400',
} as const;

// Grouped by the job the owner or staff member is actually doing, not
// by database table — this is what keeps 20+ destinations easy to scan
// instead of one long unlabeled row.
const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Dashboard',
    accent: 'green',
    items: [{ to: '/', label: 'Dashboard', icon: IconDashboard }],
  },
  {
    heading: 'Operations',
    accent: 'blue',
    items: [
      { to: '/farmers', label: 'Farmers', icon: IconUsers },
      { to: '/purchases', label: 'Purchases', icon: IconBag },
      { to: '/transport-records', label: 'Transport', icon: IconTruck },
      { to: '/transport-payments', label: 'Transport Payments', icon: IconWallet },
    ],
  },
  {
    heading: 'Inventory',
    accent: 'amber',
    items: [
      { to: '/inventory', label: 'Inventory', icon: IconBoxes },
      { to: '/crops', label: 'Crops', icon: IconLeaf },
      { to: '/crop-prices', label: 'Crop Prices', icon: IconTag },
    ],
  },
  {
    heading: 'Buyers & Sales',
    accent: 'green',
    items: [
      { to: '/buyers', label: 'Buyers', icon: IconBuilding },
      { to: '/sales', label: 'Sales', icon: IconTrendingUp },
      { to: '/payments', label: 'Buyer Payments', icon: IconCreditCard },
    ],
  },
  {
    heading: 'Finance',
    accent: 'purple',
    items: [{ to: '/expenses', label: 'Expenses', icon: IconReceipt }],
  },
  {
    heading: 'Administration',
    accent: 'gray',
    items: [
      { to: '/staff', label: 'Staff', icon: IconUserCircle, roles: ['ADMIN'] },
      { to: '/staff-assignments', label: 'Staff Assignments', icon: IconClipboardList, roles: ['ADMIN'] },
      { to: '/staff-payments', label: 'Staff Payments', icon: IconWallet, roles: ['ADMIN'] },
      { to: '/quality-statuses', label: 'Quality Config', icon: IconCheckCircle, roles: ['ADMIN'] },
      { to: '/expense-categories', label: 'Expense Config', icon: IconSettings, roles: ['ADMIN'] },
      { to: '/reports', label: 'Reports', icon: IconFileBarChart, roles: ['ADMIN'] },
      { to: '/audit-log', label: 'Audit Log', icon: IconHistory, roles: ['ADMIN'] },
      { to: '/manage-users', label: 'Manage Users', icon: IconUsers, roles: ['ADMIN'] },
      { to: '/business-profile', label: 'Business Profile', icon: IconBuilding },
    ],
  },
];

const NavLink = ({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium border-l-4 transition-colors ${
        isActive
          ? 'bg-green-600 text-white border-l-green-800 shadow-sm'
          : 'text-gray-700 border-l-transparent hover:bg-gray-100 hover:border-l-gray-300'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
      {item.label}
    </Link>
  );
};

const SidebarContent = ({
  groups,
  currentPath,
  onNavigate,
}: {
  groups: NavGroup[];
  currentPath: string;
  onNavigate?: () => void;
}) => (
  <nav aria-label="Main navigation" className="flex flex-col gap-4">
    {groups.map((group, index) => (
      <div
        key={group.heading}
        className={index > 0 ? 'pt-4 border-t border-gray-100' : undefined}
      >
        <p className="flex items-center gap-2 px-3 mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
          <span className={`h-2 w-2 rounded-full ${groupDotColors[group.accent]}`} />
          {group.heading}
        </p>
        <div className="flex flex-col gap-0.5">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              isActive={currentPath === item.to}
              onClick={onNavigate}
            />
          ))}
        </div>
      </div>
    ))}
  </nav>
);

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { confirm, confirmDialog } = useConfirmDialog();

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || (user && item.roles.includes(user.role))),
  })).filter((group) => group.items.length > 0);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Sign out?',
      message: 'You will need to sign in again to continue working.',
      confirmLabel: 'Sign out',
    });
    if (!confirmed) return;
    logout();
    navigate('/role');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-green-700 text-white px-4 py-4 sm:px-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-wide">
              <IconLeaf className="h-6 w-6 text-green-300" />
              Agri Business Management System
            </Link>
            <Link
              to="/role"
              className="rounded-md border border-green-500 px-3 py-1.5 text-sm hover:bg-green-800"
            >
              Sign in
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar — always present so there's one consistent place to find
          "who am I / how do I sign out", regardless of screen size. */}
      <header className="bg-green-700 text-white px-4 py-3 sm:px-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-green-800"
              aria-label={isDrawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isDrawerOpen}
              onClick={() => setIsDrawerOpen((open) => !open)}
            >
              <span className="sr-only">{isDrawerOpen ? 'Close menu' : 'Open menu'}</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {isDrawerOpen ? (
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
            <Link to="/" className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-wide">
              <IconLeaf className="h-5 w-5 sm:h-6 sm:w-6 text-green-300 shrink-0" />
              <span className="hidden sm:inline">Agri Business Management System</span>
              <span className="sm:hidden">Agri Business</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-green-50 font-medium">{user.name}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-green-200 bg-white/10 rounded px-1.5 py-0.5 mt-0.5">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-green-500 px-3 py-1.5 hover:bg-green-800"
            >
              <IconLogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop sidebar — persistent, no toggle needed at this width.
            Sticky + independently scrollable so the nav stays reachable
            on long content pages instead of scrolling away with main. */}
        <aside className="hidden md:block w-56 shrink-0 border-r border-gray-200 bg-white px-3 py-5 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
          <SidebarContent groups={visibleGroups} currentPath={location.pathname} />
        </aside>

        {/* Mobile drawer — shown only when toggled, no transition per the
            "no unnecessary animation" rule; it just appears/disappears. */}
        {isDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="w-72 max-w-[80vw] bg-white h-full overflow-y-auto px-3 py-5 shadow-lg">
              <div className="px-3 mb-4 text-sm text-gray-500">
                {user.name} <span className="text-gray-400">({user.role})</span>
              </div>
              <SidebarContent
                groups={visibleGroups}
                currentPath={location.pathname}
                onNavigate={() => setIsDrawerOpen(false)}
              />
            </div>
            <button
              type="button"
              aria-label="Close menu"
              className="flex-1 bg-black/30"
              onClick={() => setIsDrawerOpen(false)}
            />
          </div>
        )}

        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6">{children}</main>
      </div>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100 bg-white">
        Agri Business Management System
      </footer>

      {confirmDialog}
    </div>
  );
};

export default MainLayout;
