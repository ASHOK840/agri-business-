import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listSales } from '../../services/saleService';
import { listBuyers } from '../../services/buyerService';
import { listCrops } from '../../services/cropService';
import type { Sale, SaleStatus } from '../../types/sale.types';
import type { Buyer } from '../../types/buyer.types';
import type { Crop } from '../../types/crop.types';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import TextField from '../../components/common/TextField';
import SearchField from '../../components/common/SearchField';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import SaleStatusBadge from '../../components/common/SaleStatusBadge';
import { formatCurrency, formatDate, formatStatusLabel } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';

const statusOptions: SaleStatus[] = ['PENDING', 'CONFIRMED', 'LOADED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

const SaleListPage = () => {
  const navigate = useNavigate();

  const [sales, setSales] = useState<Sale[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [buyerFilter, setBuyerFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<SaleStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listBuyers({ limit: 100 }).then((res) => setBuyers(res.data));
    listCrops({ limit: 100 }).then((res) => setCrops(res.data));
  }, []);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listSales({
        page,
        limit: 15,
        search: searchRef.current || undefined,
        buyerId: buyerFilter || undefined,
        cropId: cropFilter || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setSales(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, buyerFilter, cropFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, buyerFilter, cropFilter, statusFilter, dateFrom, dateTo]);

  return (
    <div className="max-w-6xl mx-auto mt-6">
      <PageHeader
        title="Sales"
        action={<Button variant="secondary" onClick={() => navigate('/sales/new')}>+ New Sale</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <SearchField
            placeholder="Sale number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <SelectField
          label="Buyer"
          value={buyerFilter}
          onChange={(e) => setBuyerFilter(e.target.value)}
        >
          <option value="">All buyers</option>
          {buyers.map((buyer) => (
            <option key={buyer.id} value={buyer.id}>
              {buyer.companyName}
            </option>
          ))}
        </SelectField>
        <SelectField label="Crop" value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}>
          <option value="">All crops</option>
          {crops.map((crop) => (
            <option key={crop.id} value={crop.id}>
              {crop.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SaleStatus | '')}
        >
          <option value="">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {formatStatusLabel(status)}
            </option>
          ))}
        </SelectField>
        <TextField label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <TextField label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading sales..." />
        ) : sales.length === 0 ? (
          <EmptyState message="No sales found. Try different filters, or record a new sale." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Sale #</th>
                <th className="px-4 py-2 font-medium">Buyer</th>
                <th className="px-4 py-2 font-medium">Crop</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Date</th>
                <th className="px-4 py-2 font-medium">Revenue</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/sales/${sale.id}`} className="text-green-700 font-medium hover:underline">
                      {sale.saleNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{sale.buyer.companyName}</td>
                  <td className="px-4 py-3 text-gray-600">{sale.crop.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {formatDate(sale.saleDate)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {formatCurrency(sale.expectedRevenue)}
                  </td>
                  <td className="px-4 py-3">
                    <SaleStatusBadge status={sale.status} />
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

export default SaleListPage;
