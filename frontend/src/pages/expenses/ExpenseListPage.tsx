import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listExpenses } from '../../services/expenseService';
import { listExpenseCategories } from '../../services/expenseCategoryService';
import type { Expense, ExpenseStatus } from '../../types/expense.types';
import type { ExpenseCategory } from '../../types/expenseCategory.types';
import { useSearchTrigger } from '../../hooks/useSearchTrigger';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import TextField from '../../components/common/TextField';
import SearchField from '../../components/common/SearchField';
import SelectField from '../../components/common/SelectField';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatCurrency, formatStatusLabel } from '../../utils/format';
import PageHeader from '../../components/common/PageHeader';

const statusOptions: ExpenseStatus[] = ['ACTIVE', 'CANCELLED'];

const ExpenseListPage = () => {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [search, setSearch] = useState('');
  const { trigger: searchTrigger, valueRef: searchRef, searchNow } = useSearchTrigger(search, 400);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | ''>('ACTIVE');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listExpenseCategories({ limit: 100 }).then((res) => setCategories(res.data));
  }, []);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await listExpenses({
        page,
        limit: 15,
        search: searchRef.current || undefined,
        categoryId: categoryFilter || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setExpenses(result.data);
      setTotalPages(result.pagination.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTrigger, categoryFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    setPage(1);
  }, [searchTrigger, categoryFilter, statusFilter, dateFrom, dateTo]);

  return (
    <div className="max-w-6xl mx-auto mt-6">
      <PageHeader
        title="Expenses"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/expenses/summary')}>
              View Summary
            </Button>
            <Button variant="secondary" onClick={() => navigate('/expenses/new')}>+ Add Expense</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <div className="col-span-2 sm:col-span-1">
          <SearchField
            placeholder="Expense number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={searchNow}
          />
        </div>
        <SelectField label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ExpenseStatus | '')}
        >
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {formatStatusLabel(s)}
            </option>
          ))}
        </SelectField>
        <TextField
          label="From Date"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <TextField
          label="To Date"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <LoadingState label="Loading expenses..." />
        ) : expenses.length === 0 ? (
          <EmptyState message="No expenses found. Try different filters, or record a new expense." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Expense #</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Date</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/expenses/${expense.id}`}
                      className="text-green-700 font-medium hover:underline"
                    >
                      {expense.expenseNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{expense.category.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {formatDate(expense.expenseDate)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        expense.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {formatStatusLabel(expense.status)}
                    </span>
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

export default ExpenseListPage;
