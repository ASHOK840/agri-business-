import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listPurchases } from '../../services/purchaseService';
import { listCrops } from '../../services/cropService';
import type { Purchase, PurchaseStatus } from '../../types/purchase.types';
import type { Crop } from '../../types/crop.types';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import PurchaseStatusBadge from '../../components/common/PurchaseStatusBadge';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import TextField from '../../components/common/TextField';
import SearchField from '../../components/common/SearchField';
import SelectField from '../../components/common/SelectField';
import FarmerSearchSelect from '../../components/common/FarmerSearchSelect';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency, formatDate, formatStatusLabel } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';

const statusOptions: PurchaseStatus[] = [
  'PENDING',
  'CONFIRMED',
  'COLLECTED',
  'AT_WAREHOUSE',
  'COMPLETED',
  'CANCELLED',
];

const PurchaseListPage = () => {
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [farmerFilter, setFarmerFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    listCrops({ limit: 100 }).then((res) => setCrops(res.data));
  }, []);

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listPurchases({
        page,
        limit: 15,
        search: searchRef.current || undefined,
        farmerId: farmerFilter || undefined,
        cropId: cropFilter || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setPurchases(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, farmerFilter, cropFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, farmerFilter, cropFilter, statusFilter, dateFrom, dateTo]);

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <PageHeader
        title="Purchases"
        action={<Button variant="secondary" onClick={() => navigate('/purchases/new')}>+ New Purchase</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <SearchField
            placeholder="Purchase number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <FarmerSearchSelect value={farmerFilter} onChange={setFarmerFilter} />
        <SelectField label="Crop" value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}>
          <option value="">All crops</option>
          {crops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PurchaseStatus | '')}
        >
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {formatStatusLabel(s)}
            </option>
          ))}
        </SelectField>
        <TextField label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <TextField label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading purchases..." />
        ) : purchases.length === 0 ? (
          <EmptyState message="No purchases found. Try different filters, or record a new purchase." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Purchase #</th>
                <th className="px-4 py-2 font-medium">Farmer</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Crop</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Date</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/purchases/${purchase.id}`}
                      className="text-green-700 font-medium hover:underline"
                    >
                      {purchase.purchaseNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{purchase.farmer.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {purchase.crop.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {formatDate(purchase.purchaseDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {formatCurrency(purchase.totalGrossAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <PurchaseStatusBadge status={purchase.status} />
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

export default PurchaseListPage;
