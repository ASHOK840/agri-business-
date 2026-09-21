import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { checkBackendHealth } from '../services/healthService';
import { useAuth } from '../context/AuthContext';
import DashboardPage from './DashboardPage';

type ConnectionStatus = 'checking' | 'online' | 'offline';

const quickLinks = [
  { to: '/purchases/new', label: 'Record a Purchase', accent: 'border-l-blue-500' },
  { to: '/sales/new', label: 'Record a Sale', accent: 'border-l-green-600' },
  { to: '/transport-records/new', label: 'Log Transport', accent: 'border-l-amber-500' },
  { to: '/expenses/new', label: 'Add an Expense', accent: 'border-l-purple-500' },
];

const HomePage = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    checkBackendHealth()
      .then((data) => {
        setStatus('online');
        setMessage(data.message);
      })
      .catch(() => {
        setStatus('offline');
        setMessage('Could not reach the backend API.');
      });
  }, []);

  if (user?.role === 'ADMIN') {
    return <DashboardPage />;
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 sm:mt-10">
      <div className="rounded-xl bg-gradient-to-r from-green-700 to-green-800 text-white px-6 py-6 text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          Welcome{user ? `, ${user.name}` : ''}
        </h2>
        <p className="text-green-100">Crop Procurement &amp; Agricultural Trading Management</p>
        <div className="flex flex-col items-center gap-1 mt-4">
          <StatusBadge status={status} />
          {message && <p className="text-xs text-green-100">{message}</p>}
        </div>
      </div>

      {user && (
        <>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`bg-white rounded-lg border border-gray-200 border-l-4 ${link.accent} p-4 text-sm font-medium text-gray-700 hover:bg-gray-50`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HomePage;
