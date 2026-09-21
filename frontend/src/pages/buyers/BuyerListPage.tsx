import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listBuyers, updateBuyerStatus } from '../../services/buyerService';
import type { Buyer, BuyerStatus } from '../../types/buyer.types';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import StatusPill from '../../components/common/StatusPill';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import SearchField from '../../components/common/SearchField';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';

const BuyerListPage = () => {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [statusFilter, setStatusFilter] = useState<BuyerStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchBuyers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listBuyers({
        page,
        limit: 10,
        search: searchRef.current || undefined,
        status: statusFilter || undefined,
      });
      setBuyers(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, statusFilter]);

  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, statusFilter]);

  const handleToggleStatus = async (buyer: Buyer) => {
    const nextStatus: BuyerStatus = buyer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(buyer.id);
    try {
      await updateBuyerStatus(buyer.id, nextStatus);
      setBuyers((prev) =>
        prev.map((b) => (b.id === buyer.id ? { ...b, status: nextStatus } : b))
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <PageHeader
        title="Buyers"
        action={<Button variant="secondary" onClick={() => navigate('/buyers/new')}>+ Add Buyer</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchField
            placeholder="Search by company, contact person, phone or buyer code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <div className="sm:w-48">
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BuyerStatus | '')}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </SelectField>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading buyers..." />
        ) : buyers.length === 0 ? (
          <EmptyState message="No buyers found. Try a different search, or add a new buyer." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Buyer Code</th>
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Contact Person</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Phone</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {buyers.map((buyer) => (
                <tr key={buyer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/buyers/${buyer.id}`}
                      className="text-green-700 font-medium hover:underline"
                    >
                      {buyer.buyerCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{buyer.companyName}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {buyer.contactPerson || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {buyer.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={buyer.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      to={`/buyers/${buyer.id}/edit`}
                      className="text-sm text-gray-500 hover:text-gray-800 mr-3"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(buyer)}
                      disabled={togglingId === buyer.id}
                      className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40"
                    >
                      {buyer.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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

export default BuyerListPage;
