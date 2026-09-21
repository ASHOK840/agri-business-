import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listStaff, updateStaffStatus } from '../../services/staffService';
import type { Staff, StaffStatus } from '../../types/staff.types';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import StatusPill from '../../components/common/StatusPill';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import SearchField from '../../components/common/SearchField';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';

const StaffListPage = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [statusFilter, setStatusFilter] = useState<StaffStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listStaff({
        page,
        limit: 10,
        search: searchRef.current || undefined,
        status: statusFilter || undefined,
      });
      setStaff(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, statusFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, statusFilter]);

  const handleToggleStatus = async (member: Staff) => {
    const nextStatus: StaffStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(member.id);
    try {
      await updateStaffStatus(member.id, nextStatus);
      setStaff((prev) =>
        prev.map((s) => (s.id === member.id ? { ...s, status: nextStatus } : s))
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <PageHeader
        title="Staff"
        action={<Button variant="secondary" onClick={() => navigate('/staff/new')}>+ Add Staff</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchField
            placeholder="Search by name, phone or staff code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <div className="sm:w-48">
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StaffStatus | '')}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </SelectField>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading staff..." />
        ) : staff.length === 0 ? (
          <EmptyState message="No staff found. Try a different search, or add a new staff member." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Staff Code</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Phone</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/staff/${member.id}`}
                      className="text-green-700 font-medium hover:underline"
                    >
                      {member.staffCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{member.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {member.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={member.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      to={`/staff/${member.id}/edit`}
                      className="text-sm text-gray-500 hover:text-gray-800 mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(member)}
                      disabled={togglingId === member.id}
                      className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40"
                    >
                      {member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default StaffListPage;
