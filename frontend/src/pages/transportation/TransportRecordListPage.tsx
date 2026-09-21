import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  listTransportRecords,
  updateTransportStatus,
  getTransportCostSummary,
} from '../../services/transportRecordService';
import { listFarmers } from '../../services/farmerService';
import { listCrops } from '../../services/cropService';
import { listBuyers } from '../../services/buyerService';
import type { TransportRecord, TransportDirection, TransportStatus } from '../../types/transportRecord.types';
import type { Farmer } from '../../types/farmer.types';
import type { Crop } from '../../types/crop.types';
import type { Buyer } from '../../types/buyer.types';
import TransportStatusBadge from '../../components/common/TransportStatusBadge';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import TextField from '../../components/common/TextField';
import SearchField from '../../components/common/SearchField';
import SelectField from '../../components/common/SelectField';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import { formatDate, formatCurrency } from '../../utils/format';

const directionLabels: Record<TransportDirection, string> = {
  FARMER_TO_WAREHOUSE: 'Farmer → Warehouse',
  WAREHOUSE_TO_BUYER: 'Warehouse → Buyer',
};

const statusOptions: TransportStatus[] = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

const TransportRecordListPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<TransportRecord[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [directionFilter, setDirectionFilter] = useState<TransportDirection | ''>('');
  const [statusFilter, setStatusFilter] = useState<TransportStatus | ''>('');
  const [farmerFilter, setFarmerFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    listFarmers({ limit: 100 }).then((res) => setFarmers(res.data));
    listCrops({ limit: 100 }).then((res) => setCrops(res.data));
    listBuyers({ limit: 100 }).then((res) => setBuyers(res.data));
  }, []);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listTransportRecords({
        page,
        limit: 15,
        search: searchRef.current || undefined,
        direction: directionFilter || undefined,
        status: statusFilter || undefined,
        farmerId: farmerFilter || undefined,
        cropId: cropFilter || undefined,
        buyerId: buyerFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setRecords(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, directionFilter, statusFilter, farmerFilter, cropFilter, buyerFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, directionFilter, statusFilter, farmerFilter, cropFilter, buyerFilter, dateFrom, dateTo]);

  useEffect(() => {
    getTransportCostSummary({}).then((s) => setTotalCost(s.totalTransportCost));
  }, [records.length]);

  const handleStatusChange = async (record: TransportRecord, status: TransportStatus) => {
    setActingId(record.id);
    try {
      await updateTransportStatus(record.id, status);
      fetchRecords();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <PageHeader
        title="Transportation"
        action={<Button variant="secondary" onClick={() => navigate('/transport-records/new')}>+ Record Transport</Button>}
      />

      <div className="flex gap-4 text-sm text-gray-500 mb-4">
        <button onClick={() => navigate('/transporters')} className="hover:text-green-700 hover:underline">
          Manage Transporters
        </button>
        <button onClick={() => navigate('/drivers')} className="hover:text-green-700 hover:underline">
          Manage Drivers
        </button>
        <button onClick={() => navigate('/vehicles')} className="hover:text-green-700 hover:underline">
          Manage Vehicles
        </button>
      </div>

      {totalCost !== null && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4 inline-block">
          <span className="text-xs text-gray-400">Total transport expense (all time)</span>
          <p className="text-lg font-semibold text-gray-800">{formatCurrency(totalCost)}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <SearchField
            placeholder="From / to / transporter"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <SelectField
          label="Direction"
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value as TransportDirection | '')}
        >
          <option value="">All directions</option>
          <option value="FARMER_TO_WAREHOUSE">Farmer → Warehouse</option>
          <option value="WAREHOUSE_TO_BUYER">Warehouse → Buyer</option>
        </SelectField>
        <SelectField
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TransportStatus | '')}
        >
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </SelectField>
        <SelectField label="Crop" value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}>
          <option value="">All crops</option>
          {crops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Farmer" value={farmerFilter} onChange={(e) => setFarmerFilter(e.target.value)}>
          <option value="">All farmers</option>
          {farmers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Buyer" value={buyerFilter} onChange={(e) => setBuyerFilter(e.target.value)}>
          <option value="">All buyers</option>
          {buyers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.companyName}
            </option>
          ))}
        </SelectField>
        <TextField label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <TextField label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading transport records..." />
        ) : records.length === 0 ? (
          <EmptyState message="No transport records found. Record one to get started." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Route</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Crop</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Date</th>
                <th className="px-4 py-2 font-medium">Cost</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/transport-records/${r.id}`} className="text-gray-800 font-medium hover:underline hover:text-green-700">
                      {directionLabels[r.direction]}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {r.fromLocation} → {r.toLocation}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{r.crop.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {formatDate(r.transportDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {formatCurrency(r.transportCost)}
                  </td>
                  <td className="px-4 py-3">
                    <TransportStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3">
                      {r.status === 'PENDING' || r.status === 'IN_TRANSIT' ? (
                        <select
                          value={r.status}
                          onChange={(e) =>
                            handleStatusChange(r, e.target.value as TransportStatus)
                          }
                          disabled={actingId === r.id}
                          className="text-sm rounded-md border border-gray-300 px-2 py-1"
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      <Link
                        to={`/transport-records/${r.id}`}
                        className="text-xs text-green-700 hover:underline"
                      >
                        View / Pay
                      </Link>
                    </div>
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

export default TransportRecordListPage;
