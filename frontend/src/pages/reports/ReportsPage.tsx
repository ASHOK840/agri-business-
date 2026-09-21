import { useEffect, useMemo, useState, useCallback } from 'react';
import { getReport, downloadReportCsv } from '../../services/reportService';
import { listFarmers } from '../../services/farmerService';
import { listCrops } from '../../services/cropService';
import { listBuyers } from '../../services/buyerService';
import { listStaff } from '../../services/staffService';
import type { ReportType, ReportResult } from '../../types/report.types';
import type { Farmer } from '../../types/farmer.types';
import type { Crop } from '../../types/crop.types';
import type { Buyer } from '../../types/buyer.types';
import type { Staff } from '../../types/staff.types';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

type FilterKey = 'dateRange' | 'farmer' | 'crop' | 'buyer' | 'staff' | 'status';

interface ReportConfig {
  type: ReportType;
  label: string;
  filters: FilterKey[];
  statusLabel?: string;
  statusOptions?: string[];
}

const PURCHASE_STATUSES = ['PENDING', 'CONFIRMED', 'COLLECTED', 'AT_WAREHOUSE', 'COMPLETED', 'CANCELLED'];
const SALE_STATUSES = ['PENDING', 'CONFIRMED', 'LOADED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
const TRANSPORT_STATUSES = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
const ASSIGNMENT_STATUSES = ['ASSIGNED', 'COMPLETED', 'CANCELLED'];
const EXPENSE_STATUSES = ['ACTIVE', 'CANCELLED'];
const SETTLEMENT_STATUSES = ['ACCEPTED', 'PRICE_ADJUSTED', 'REJECTED'];
const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'];

const REPORT_CONFIGS: ReportConfig[] = [
  { type: 'farmer', label: 'Farmer Report', filters: ['dateRange', 'farmer', 'crop', 'status'], statusOptions: PURCHASE_STATUSES },
  { type: 'crop-purchase', label: 'Crop Purchase Report', filters: ['dateRange', 'farmer', 'crop', 'status'], statusOptions: PURCHASE_STATUSES },
  { type: 'crop-sales', label: 'Crop Sales Report', filters: ['dateRange', 'crop', 'buyer', 'status'], statusOptions: SALE_STATUSES },
  { type: 'inventory', label: 'Inventory Report', filters: ['dateRange', 'crop'] },
  { type: 'buyer', label: 'Buyer Report', filters: ['dateRange', 'crop', 'buyer', 'status'], statusOptions: SALE_STATUSES },
  { type: 'farmer-payment', label: 'Farmer Payment Report', filters: ['dateRange', 'farmer', 'crop', 'status'], statusOptions: PURCHASE_STATUSES },
  { type: 'buyer-payment', label: 'Buyer Payment Report', filters: ['dateRange', 'buyer', 'crop', 'status'], statusLabel: 'Payment Method', statusOptions: PAYMENT_METHODS },
  { type: 'transport-expense', label: 'Transport Expense Report', filters: ['dateRange', 'crop', 'buyer', 'farmer', 'status'], statusOptions: TRANSPORT_STATUSES },
  { type: 'labour', label: 'Labour Report', filters: ['dateRange', 'staff', 'crop', 'status'], statusOptions: ASSIGNMENT_STATUSES },
  { type: 'expense', label: 'Expense Report', filters: ['dateRange', 'crop', 'farmer', 'buyer', 'status'], statusOptions: EXPENSE_STATUSES },
  { type: 'profit-loss', label: 'Profit / Loss Report', filters: ['dateRange', 'crop', 'buyer', 'status'], statusLabel: 'Settlement Outcome', statusOptions: SETTLEMENT_STATUSES },
  { type: 'weight-loss', label: 'Weight-Loss Report', filters: ['dateRange', 'crop', 'buyer'] },
  { type: 'quality-rejection', label: 'Quality / Rejection Report', filters: ['dateRange', 'crop', 'buyer', 'status'], statusLabel: 'Outcome', statusOptions: ['PRICE_ADJUSTED', 'REJECTED'] },
];

const formatCell = (value: string | number | null) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return value;
};

const ReportsPage = () => {
  const [reportType, setReportType] = useState<ReportType>('farmer');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [farmerId, setFarmerId] = useState('');
  const [cropId, setCropId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [status, setStatus] = useState('');

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [result, setResult] = useState<ReportResult | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listFarmers({ limit: 200 }).then((res) => setFarmers(res.data));
    listCrops({ limit: 200 }).then((res) => setCrops(res.data));
    listBuyers({ limit: 200 }).then((res) => setBuyers(res.data));
    listStaff({ limit: 200 }).then((res) => setStaff(res.data));
  }, []);

  const config = useMemo(() => REPORT_CONFIGS.find((c) => c.type === reportType)!, [reportType]);

  // Reset filters not applicable to the newly selected report, and any
  // status value left over from a different report's status vocabulary.
  useEffect(() => {
    if (!config.filters.includes('farmer')) setFarmerId('');
    if (!config.filters.includes('crop')) setCropId('');
    if (!config.filters.includes('buyer')) setBuyerId('');
    if (!config.filters.includes('staff')) setStaffId('');
    setStatus('');
  }, [reportType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Any filter change starts back at page 1 — an old page number from a
  // previous, larger result set could otherwise land past the end.
  useEffect(() => {
    setPage(1);
  }, [reportType, dateFrom, dateTo, farmerId, cropId, buyerId, staffId, status]);

  const filters = useMemo(
    () => ({
      page,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      farmerId: farmerId || undefined,
      cropId: cropId || undefined,
      buyerId: buyerId || undefined,
      staffId: staffId || undefined,
      status: status || undefined,
    }),
    [page, dateFrom, dateTo, farmerId, cropId, buyerId, staffId, status]
  );

  const runReport = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getReport(reportType, filters);
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not load report.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [reportType, filters]);

  useEffect(() => {
    runReport();
  }, [runReport]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await downloadReportCsv(reportType, filters);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-6 mb-10">
      <div className="no-print">
        <PageHeader title="Business Reports" subtitle="All figures are calculated live from actual records." />
      </div>

      <div className="no-print bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <SelectField
            label="Report"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
          >
            {REPORT_CONFIGS.map((c) => (
              <option key={c.type} value={c.type}>
                {c.label}
              </option>
            ))}
          </SelectField>

          {config.filters.includes('dateRange') && (
            <>
              <TextField label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <TextField label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {config.filters.includes('farmer') && (
            <SelectField label="Farmer" value={farmerId} onChange={(e) => setFarmerId(e.target.value)}>
              <option value="">All farmers</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </SelectField>
          )}

          {config.filters.includes('crop') && (
            <SelectField label="Crop" value={cropId} onChange={(e) => setCropId(e.target.value)}>
              <option value="">All crops</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
          )}

          {config.filters.includes('buyer') && (
            <SelectField label="Buyer" value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
              <option value="">All buyers</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.companyName}
                </option>
              ))}
            </SelectField>
          )}

          {config.filters.includes('staff') && (
            <SelectField label="Staff" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">All staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          )}

          {config.filters.includes('status') && config.statusOptions && (
            <SelectField label={config.statusLabel || 'Status'} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {config.statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </SelectField>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={runReport} isLoading={isLoading}>
            Run Report
          </Button>
          <Button variant="secondary" onClick={handleExportCsv} isLoading={isExporting} disabled={!result || result.rows.length === 0}>
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => window.print()} disabled={!result || result.rows.length === 0}>
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Loading report..." />
      ) : result ? (
        <>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">{config.label}</h3>

          {result.summary && (
            <div className="flex flex-wrap gap-3 mb-4">
              {Object.entries(result.summary).map(([key, value]) => (
                <div key={key} className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm">
                  <span className="text-gray-500 mr-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}:
                  </span>
                  <span className="font-medium text-gray-800">{formatCell(value)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            {result.rows.length === 0 ? (
              <EmptyState message="No data found for the selected filters." />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    {result.columns.map((col) => (
                      <th key={col.key} className="px-4 py-2 font-medium whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.rows.map((row, i) => (
                    <tr key={i}>
                      {result.columns.map((col) => (
                        <td key={col.key} className="px-4 py-2 text-gray-700 whitespace-nowrap">
                          {formatCell(row[col.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="no-print">
            <Pagination page={page} totalPages={result.pagination.totalPages} onPageChange={setPage} />
          </div>
          <p className="no-print text-xs text-gray-400 mt-1">
            Showing page {result.pagination.page} of {result.pagination.totalPages} (
            {result.pagination.total} matching records — export CSV for the full set).
          </p>
        </>
      ) : null}
    </div>
  );
};

export default ReportsPage;
