import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listStaffPayments } from '../../services/staffPaymentService';
import { listStaff } from '../../services/staffService';
import type { StaffPayment, PaymentMethod, StaffPaymentStatus } from '../../types/staffPayment.types';
import type { Staff } from '../../types/staff.types';
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

const statusBadgeClass: Record<StaffPaymentStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-green-50 text-green-700 border-green-200',
};

const StaffPaymentsListPage = () => {
  const [payments, setPayments] = useState<StaffPayment[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [staffFilter, setStaffFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    listStaff({ limit: 100 }).then((res) => setStaffList(res.data));
  }, []);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listStaffPayments({
        page,
        limit: 15,
        search: searchRef.current || undefined,
        staffId: staffFilter || undefined,
        paymentMethod: methodFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setPayments(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, staffFilter, methodFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, staffFilter, methodFilter, dateFrom, dateTo]);

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <PageHeader
        title="Staff Payments"
        subtitle="Every payment is recorded against a specific staff assignment — open an assignment to pay a staff member."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <SearchField
            placeholder="Payment # / purchase / staff"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <SelectField label="Staff" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
          <option value="">All staff</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
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
                <th className="px-4 py-2 font-medium">Staff</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Purchase</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Date</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Assignment Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">{payment.paymentNumber}</td>
                  <td className="px-4 py-3 text-gray-800">{payment.staff.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    <Link to={`/staff-assignments/${payment.assignment.id}`} className="hover:underline">
                      {payment.assignment.purchase.purchaseNumber}
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
                    <div className="flex flex-col items-start gap-0.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass[payment.assignmentPaymentStatus]}`}
                      >
                        {payment.assignmentPaymentStatus === 'PAID' ? 'Fully Paid' : payment.assignmentPaymentStatus}
                      </span>
                      {payment.assignmentPaymentStatus !== 'PAID' && (
                        <span className="text-xs text-red-600">
                          {formatCurrency(payment.assignmentOutstandingAmount)} due
                        </span>
                      )}
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

export default StaffPaymentsListPage;
