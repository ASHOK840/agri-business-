import { Fragment, useEffect, useState, useCallback } from 'react';
import { listAuditLogs } from '../../services/auditLogService';
import type { AuditLog } from '../../types/auditLog.types';
import Pagination from '../../components/common/Pagination';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { formatDateTime } from '../../utils/format';

const ACTION_OPTIONS = [
  'FARMER_CREATED',
  'FARMER_UPDATED',
  'FARMER_STATUS_CHANGED',
  'BUYER_CREATED',
  'BUYER_UPDATED',
  'BUYER_STATUS_CHANGED',
  'PURCHASE_CREATED',
  'PURCHASE_CANCELLED',
  'PRICE_CHANGED',
  'SALE_CREATED',
  'SALE_SETTLED',
  'PAYMENT_CREATED',
  'EXPENSE_CREATED',
  'INVENTORY_ADJUSTED',
];

const ENTITY_TYPE_OPTIONS = [
  'Farmer',
  'Buyer',
  'Purchase',
  'CropPrice',
  'Sale',
  'SaleSettlement',
  'BuyerPayment',
  'Expense',
  'InventoryTransaction',
];

const actionBadgeClass = (action: string) => {
  if (action.includes('CANCELLED')) return 'bg-red-50 text-red-700 border-red-200';
  if (action.includes('CREATED')) return 'bg-green-50 text-green-700 border-green-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [entityIdFilter, setEntityIdFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listAuditLogs({
        page,
        limit: 30,
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
        entityId: entityIdFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setLogs(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter, entityTypeFilter, entityIdFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, entityTypeFilter, entityIdFilter, dateFrom, dateTo]);

  return (
    <div className="max-w-5xl mx-auto mt-6 mb-10">
      <PageHeader
        title="Audit Log"
        subtitle="A record of important business changes — who did what, and when."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <SelectField label="Action" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
          <option value="">All actions</option>
          {ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, ' ')}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Entity Type"
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
        >
          <option value="">All entities</option>
          {ENTITY_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Entity ID"
          placeholder="Exact ID"
          value={entityIdFilter}
          onChange={(e) => setEntityIdFilter(e.target.value)}
        />
        <TextField label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <TextField label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading audit log..." />
        ) : logs.length === 0 ? (
          <EmptyState message="No audit entries found for the selected filters." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Entity</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">IP Address</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      <p className="font-medium">{log.userName}</p>
                      <p className="text-xs text-gray-400">{log.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${actionBadgeClass(log.action)}`}
                      >
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {log.entityType}
                      <span className="text-xs text-gray-400 block">{log.entityId.slice(0, 8)}...</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="text-xs text-green-700 hover:underline"
                      >
                        {expandedId === log.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              Before
                            </p>
                            <pre className="bg-white border border-gray-200 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words">
                              {log.oldValue ? JSON.stringify(log.oldValue, null, 2) : '—'}
                            </pre>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1">
                              After
                            </p>
                            <pre className="bg-white border border-gray-200 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words">
                              {log.newValue ? JSON.stringify(log.newValue, null, 2) : '—'}
                            </pre>
                          </div>
                        </div>
                        {log.userAgent && (
                          <p className="text-xs text-gray-400 mt-3">Device: {log.userAgent}</p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
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

export default AuditLogPage;
