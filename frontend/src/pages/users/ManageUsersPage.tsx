import { useEffect, useState, type FormEvent } from 'react';
import PageHeader from '../../components/common/PageHeader';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import StatusPill from '../../components/common/StatusPill';
import { listUsers, createUser, updateUserStatus, resetUserPassword } from '../../services/userService';
import type { ManagedUser } from '../../types/user.types';

// Admin-only. This is the entire account-provisioning surface for Staff
// and Transportation logins — there is no public signup anywhere in the
// app; the Father/Owner creates every account here and hands out the
// username/password directly.
const ManageUsersPage = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STAFF' | 'TRANSPORTATION'>('STAFF');
  const [formError, setFormError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  const loadUsers = () => {
    setIsLoading(true);
    listUsers()
      .then((all) => setUsers(all.filter((u) => u.role !== 'ADMIN')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (name.trim().length < 2) {
      setFormError('Enter the person\'s name.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsCreating(true);
    try {
      await createUser({ name: name.trim(), email: email.trim(), password, role });
      setName('');
      setEmail('');
      setPassword('');
      setRole('STAFF');
      loadUsers();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not create this account.';
      setFormError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (user: ManagedUser) => {
    setBusyId(user.id);
    try {
      await updateUserStatus(user.id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setResetError('');
    if (resetPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (!resetTargetId) return;

    setBusyId(resetTargetId);
    try {
      await resetUserPassword(resetTargetId, resetPassword);
      setResetTargetId(null);
      setResetPassword('');
    } catch {
      setResetError('Could not reset the password.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <PageHeader title="Manage Users" subtitle="Create and manage Staff and Transportation logins." />

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Create a new account</h3>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          {formError && <Alert type="error" message={formError} />}
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField
            label="Username / Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="At least 6 characters. Share this with the person directly."
            required
          />
          <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as 'STAFF' | 'TRANSPORTATION')}>
            <option value="STAFF">Staff</option>
            <option value="TRANSPORTATION">Transportation</option>
          </SelectField>
          <Button type="submit" isLoading={isCreating} className="w-full sm:w-auto">
            Create Account
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading users..." />
        ) : users.length === 0 ? (
          <EmptyState message="No Staff or Transportation accounts yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium hidden sm:table-cell">Username</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{user.email}</td>
                    <td className="px-4 py-3 text-gray-600">{user.role}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={user.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setResetTargetId(user.id);
                          setResetPassword('');
                          setResetError('');
                        }}
                        className="text-sm text-gray-500 hover:text-gray-800 mr-3"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={busyId === user.id}
                        className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40"
                      >
                        {user.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resetTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Reset Password</h3>
            <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
              {resetError && <Alert type="error" message={resetError} />}
              <TextField
                label="New Password"
                type="text"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                autoFocus
                required
              />
              <div className="flex justify-end gap-3 mt-2">
                <Button type="button" variant="secondary" onClick={() => setResetTargetId(null)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={busyId === resetTargetId}>
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersPage;
