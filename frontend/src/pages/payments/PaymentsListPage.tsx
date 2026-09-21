import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listBuyerPayments } from '../../services/buyerPaymentService';
import { listBuyers } from '../../services/buyerService';
import { listCrops } from '../../services/cropService';
import type { BuyerPayment, PaymentMethod, SalePaymentStatus } from '../../types/buyerPayment.types';
import type { Buyer } from '../../types/buyer.types';
import type { Crop } from '../../types/crop.types';
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

const statusBadgeClass: Record<SalePaymentStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-green-50 text-green-700 border-green-200',
};

const PaymentsListPage = () => {
  const [payments, setPayments] = useState<BuyerPayment[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [buyerFilter, setBuyerFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    listBuyers({ limit: 100 }).then((res) => setBuyers(res.data));
    listCrops({ limit: 100 }).then((res) => setCrops(res.data));
  }, []);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listBuyerPayments({
        page,
        limit: 15,
        search: searchRef.current || undefined,
        buyerId: buyerFilter || undefined,
        cropId: cropFilter || undefined,
        paymentMethod: methodFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setPayments(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, buyerFilter, cropFilter, methodFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, buyerFilter, cropFilter, methodFilter, dateFrom, dateTo]);

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <PageHeader
        title="Buyer Payments"
        subtitle="Every payment is recorded against a specific sale — open a sale to record a new one."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <SearchField
            placeholder="Payment # / reference"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <SelectField label="Buyer" value={buyerFilter} onChange={(e) => setBuyerFilter(e.target.value)}>
          <option value="">All buyers</option>
          {buyers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.companyName}
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
                <th className="px-4 py-2 font-medium">Buyer</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Sale #</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Date</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Sale Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/buyer-payments/${payment.id}/receipt`}
                      className="text-green-700 font-medium hover:underline"
                    >
                      {payment.paymentNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{payment.buyer.companyName}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    <Link to={`/sales/${payment.sale.id}`} className="hover:underline">
                      {payment.sale.saleNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{paymentMethodLabels[payment.paymentMethod]}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {payment.salePaymentStatus ? (
                      <div className="flex flex-col items-start gap-0.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass[payment.salePaymentStatus]}`}
                        >
                          {payment.salePaymentStatus === 'PAID' ? 'Fully Paid' : payment.salePaymentStatus}
                        </span>
                        {payment.salePaymentStatus !== 'PAID' && (
                          <span className="text-xs text-red-600">
                            {formatCurrency(payment.saleOutstandingAmount ?? 0)} due
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Not settled yet</span>
                    )}
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

export default PaymentsListPage;
