import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleHome } from '../routes/roleHome';
import { IconUserCircle, IconClipboardList, IconTruck, IconLeaf } from '../components/common/icons';

const roleOptions = [
  { to: '/login/admin', label: 'Father / Owner', hint: 'Full business access', icon: IconUserCircle },
  { to: '/login/staff', label: 'Staff', hint: 'Record farmer & crop entries', icon: IconClipboardList },
  { to: '/login/transportation', label: 'Transportation', hint: 'My trips', icon: IconTruck },
];

// The very first screen anyone sees. Deliberately just three big buttons
// — no marketing copy, no fields — so a non-technical Staff/Transportation
// user always knows exactly where to tap.
const RoleSelectPage = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return (
    <div className="max-w-sm mx-auto mt-10 sm:mt-20 px-2">
      <div className="text-center mb-8">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-700 text-white">
          <IconLeaf className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">Agri Business Management System</h1>
        <p className="text-gray-500 mt-2 text-lg">Who are you?</p>
      </div>

      <div className="flex flex-col gap-4">
        {roleOptions.map((option) => (
          <Link
            key={option.to}
            to={option.to}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-5 hover:bg-green-50 hover:border-green-300 transition"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <option.icon className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-gray-800">{option.label}</span>
              <span className="block text-sm text-gray-500 mt-0.5">{option.hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RoleSelectPage;
