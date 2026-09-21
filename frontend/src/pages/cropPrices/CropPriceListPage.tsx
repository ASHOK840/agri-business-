import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listCropPrices, getLatestCropPrices } from '../../services/cropPriceService';
import { listCrops } from '../../services/cropService';
import { listBuyers } from '../../services/buyerService';
import type { CropPrice } from '../../types/cropPrice.types';
import type { Crop } from '../../types/crop.types';
import type { Buyer } from '../../types/buyer.types';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatCurrency } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';

const sourceLabels: Record<string, string> = {
  MARKET: 'Market Rate',
  BUYER_QUOTE: 'Buyer Quote',
  MANUAL: 'Manual Note',
};

const CropPriceListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [latestPrices, setLatestPrices] = useState<CropPrice[]>([]);
  const [history, setHistory] = useState<CropPrice[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);

  // Pre-filled from ?cropId=... when linked from a crop's detail page.
  const [cropFilter, setCropFilter] = useState(searchParams.get('cropId') || '');
  const [buyerFilter, setBuyerFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reference data for the filter dropdowns.
  useEffect(() => {
    listCrops({ limit: 100 }).then((res) => setCrops(res.data));
    listBuyers({ limit: 100 }).then((res) => setBuyers(res.data));
  }, []);

  // "Latest price" overview — respects the buyer filter only, so it
  // always shows a clean per-crop snapshot regardless of the history
  // table's crop/date filters below.
  useEffect(() => {
    setIsLoadingLatest(true);
    getLatestCropPrices({ buyerId: buyerFilter || undefined })
      .then(setLatestPrices)
      .finally(() => setIsLoadingLatest(false));
  }, [buyerFilter]);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const result = await listCropPrices({
        page,
        limit: 15,
        cropId: cropFilter || undefined,
        buyerId: buyerFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setHistory(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [page, cropFilter, buyerFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    setPage(1);
  }, [cropFilter, buyerFilter, dateFrom, dateTo]);

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <PageHeader
        title="Crop Prices"
        action={<Button variant="secondary" onClick={() => navigate('/crop-prices/new')}>+ Add Price</Button>}
      />

      {/* Latest price overview */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Latest Prices{buyerFilter ? ' (this buyer)' : ''}
        </h3>
        {isLoadingLatest ? (
          <LoadingState />
        ) : latestPrices.length === 0 ? (
          <p className="text-sm text-gray-400">
            No prices recorded yet. Add one below to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {latestPrices.map((price) => (
              <div
                key={price.id}
                className="bg-white rounded-lg border border-gray-200 p-3"
              >
                <p className="text-xs text-gray-400">{price.crop.name}</p>
                <p className="text-lg font-semibold text-gray-800">
                  {formatCurrency(price.pricePerKg)}
                  <span className="text-xs font-normal text-gray-400">/kg</span>
                </p>
                <p className="text-xs text-gray-400">{formatDate(price.effectiveDate)}</p>
                {price.buyer && (
                  <p className="text-xs text-gray-400 truncate">{price.buyer.companyName}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Price History
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <SelectField label="Crop" value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}>
          <option value="">All crops</option>
          {crops.map((crop) => (
            <option key={crop.id} value={crop.id}>
              {crop.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Buyer" value={buyerFilter} onChange={(e) => setBuyerFilter(e.target.value)}>
          <option value="">All buyers</option>
          {buyers.map((buyer) => (
            <option key={buyer.id} value={buyer.id}>
              {buyer.companyName}
            </option>
          ))}
        </SelectField>
        <TextField label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <TextField label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      {/* History table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoadingHistory ? (
          <LoadingState label="Loading price history..." />
        ) : history.length === 0 ? (
          <EmptyState message="No price records match these filters." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Crop</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Buyer</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Quality</th>
                <th className="px-4 py-2 font-medium">Price (₹/kg)</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Type</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{formatDate(price.effectiveDate)}</td>
                  <td className="px-4 py-3 text-gray-800">{price.crop.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {price.buyer?.companyName || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {price.quality || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {formatCurrency(price.pricePerKg)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {sourceLabels[price.sourceType]}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {price.createdByUser.name}
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

export default CropPriceListPage;
