import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listFarmers, updateFarmerStatus } from '../../services/farmerService';
import type { Farmer, FarmerStatus } from '../../types/farmer.types';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import StatusPill from '../../components/common/StatusPill';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import SearchField from '../../components/common/SearchField';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';

const FarmerListPage = () => {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [statusFilter, setStatusFilter] = useState<FarmerStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchFarmers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listFarmers({
        page,
        limit: 10,
        search: searchRef.current || undefined,
        status: statusFilter || undefined,
      });
      setFarmers(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTrigger, statusFilter]);

  useEffect(() => {
    fetchFarmers();
  }, [fetchFarmers]);

  // Reset to page 1 whenever the search/filter changes, so results aren't
  // stuck on a page number that no longer exists. searchTrigger covers
  // both the auto-debounced search and an explicit Search click.
  useEffect(() => {
    setPage(1);
  }, [searchTrigger, statusFilter]);

  const handleToggleStatus = async (farmer: Farmer) => {
    const nextStatus: FarmerStatus = farmer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(farmer.id);
    try {
      await updateFarmerStatus(farmer.id, nextStatus);
      setFarmers((prev) =>
        prev.map((f) => (f.id === farmer.id ? { ...f, status: nextStatus } : f))
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <PageHeader
        title="Farmers"
        action={<Button variant="secondary" onClick={() => navigate('/farmers/new')}>+ Add Farmer</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchField
            placeholder="Search by name, phone or farmer code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <div className="sm:w-48">
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FarmerStatus | '')}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </SelectField>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading farmers..." />
        ) : farmers.length === 0 ? (
          <EmptyState message="No farmers found. Try a different search, or add a new farmer." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Farmer Code</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Phone</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Village</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {farmers.map((farmer) => (
                <tr key={farmer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/farmers/${farmer.id}`}
                      className="text-green-700 font-medium hover:underline"
                    >
                      {farmer.farmerCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{farmer.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {farmer.phone || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {farmer.village || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={farmer.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      to={`/farmers/${farmer.id}/edit`}
                      className="text-sm text-gray-500 hover:text-gray-800 mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(farmer)}
                      disabled={togglingId === farmer.id}
                      className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40"
                    >
                      {farmer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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

export default FarmerListPage;
