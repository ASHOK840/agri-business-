import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconBag, IconClipboardList } from '../../components/common/icons';

// Exactly two choices — this is the entire Staff job. No stock, no
// accounting, no menus to get lost in.
const StaffHomePage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-md mx-auto mt-4 flex flex-col gap-6">
      <p className="text-lg text-gray-600">
        Hello, <span className="font-semibold text-gray-800">{user?.name || 'Staff'}</span>
      </p>

      <div className="flex flex-col gap-4">
        <Link
          to="/staff/add-entry"
          className="flex flex-col items-center justify-center gap-2 rounded-xl bg-green-700 text-white text-center py-9 text-xl font-semibold shadow-sm hover:bg-green-800"
        >
          <IconBag className="h-8 w-8" />
          Add Farmer Entry
        </Link>
        <Link
          to="/staff/entries"
          className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 text-gray-800 text-center py-9 text-xl font-semibold shadow-sm hover:bg-gray-50"
        >
          <IconClipboardList className="h-8 w-8 text-gray-400" />
          Today's Entries
        </Link>
      </div>
    </div>
  );
};

export default StaffHomePage;
