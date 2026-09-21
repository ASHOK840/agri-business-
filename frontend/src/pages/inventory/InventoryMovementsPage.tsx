import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listMovements } from '../../services/inventoryService';
import { listCrops } from '../../services/cropService';
import type { InventoryMovement, MovementType } from '../../types/inventory.types';
import type { Crop } from '../../types/crop.types';
import Pagination from '../../components/common/Pagination';
import TextField from '../../components/common/TextField';
import SearchField from '../../components/common/SearchField';
import SelectField from '../../components/common/SelectField';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import { formatDate, formatWeight } from '../../utils/format';

const typeStyles: Record<MovementType, string> = {
  IN: 'bg-green-50 text-green-700 border-green-200',
  OUT: 'bg-blue-50 text-blue-700 border-blue-200',
  ADJUSTMENT: 'bg-amber-50 text-amber-700 border-amber-200',
};

const InventoryMovementsPage = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cropFilter, setCropFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<MovementType | ''>('');
  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    listCrops({ limit: 100 }).then((res) => setCrops(res.data));
  }, []);

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listMovements({
        page,
        limit: 20,
        search: searchRef.current || undefined,
        cropId: cropFilter || undefined,
        movementType: typeFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setMovements(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, cropFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, cropFilter, typeFilter, dateFrom, dateTo]);

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <Link to="/inventory" className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to Inventory
      </Link>

      <div className="mt-3">
        <PageHeader
          title="Stock Movement History"
          subtitle="Every movement is permanent — corrections are made with a new entry, never by editing history."
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <SearchField
            placeholder="Notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <SelectField label="Crop" value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}>
          <option value="">All crops</option>
          {crops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as MovementType | '')}
        >
          <option value="">All types</option>
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
          <option value="ADJUSTMENT">ADJUSTMENT</option>
        </SelectField>
        <TextField label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <TextField label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading movements..." />
        ) : movements.length === 0 ? (
          <EmptyState message="No movements match these filters." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Crop</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Quantity</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Reference</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{formatDate(m.movementDate)}</td>
                  <td className="px-4 py-3 text-gray-800">{m.crop.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${typeStyles[m.movementType]}`}
                    >
                      {m.movementType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {Number(m.quantityKg) > 0 && m.movementType !== 'OUT' ? '+' : ''}
                    {m.movementType === 'OUT' ? '-' : ''}
                    {formatWeight(Math.abs(Number(m.quantityKg)))}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {m.referenceType}
                    {m.purchase && ` (${m.purchase.purchaseNumber})`}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {m.createdByUser.name}
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

export default InventoryMovementsPage;
