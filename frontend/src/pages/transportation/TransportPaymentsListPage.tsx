import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listTransportPayments } from '../../services/transportPaymentService';
import { transporterApi } from '../../services/transportMasterService';
import type { TransportPayment, PaymentMethod } from '../../types/transportPayment.types';
import type { Transporter } from '../../types/transportMaster.types';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import Pagination from '../../components/common/Pagination';
import TextField from '../../components/common/TextField';
import SearchField from '../../components/common/SearchField';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatCurrency } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

const TransportPaymentsListPage = () => {
  const [payments, setPayments] = useState<TransportPayment[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [transporterFilter, setTransporterFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    transporterApi.list({ limit: 100 }).then((res) => setTransporters(res.data));
  }, []);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listTransportPayments({
        page,
        limit: 15,
        search: searchRef.current || undefined,
        transporterId: transporterFilter || undefined,
        paymentMethod: methodFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setPayments(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, transporterFilter, methodFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, transporterFilter, methodFilter, dateFrom, dateTo]);

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <PageHeader
        title="Transport Payments"
        subtitle="Every payment is recorded against a specific transport record — open a record to pay a transporter."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <SearchField
            placeholder="Payment # / route / transporter"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <SelectField
          label="Transporter"
          value={transporterFilter}
          onChange={(e) => setTransporterFilter(e.target.value)}
        >
          <option value="">All transporters</option>
          {transporters.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Method"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | '')}
        >
          <option value="">All methods</option>
          {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((m) => (
            <option key={m} value={m}>
              {paymentMethodLabels[m]}
            </option>
          ))}
        </SelectField>
        <TextField label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <TextField label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading payments..." />
        ) : payments.length === 0 ? (
          <EmptyState message="No payments found. Try different filters." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Payment #</th>
                <th className="px-4 py-2 font-medium">Transporter</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Route</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Date</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">{payment.paymentNumber}</td>
                  <td className="px-4 py-3 text-gray-800">{payment.transporter.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    <Link to={`/transport-records/${payment.transportRecord.id}`} className="hover:underline">
                      {payment.transportRecord.fromLocation} → {payment.transportRecord.toLocation}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{paymentMethodLabels[payment.paymentMethod]}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {formatCurrency(payment.amount)}
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

export default TransportPaymentsListPage;
