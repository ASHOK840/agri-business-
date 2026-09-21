import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getExpenseSummary } from '../../services/expenseService';
import type { ExpenseSummary } from '../../types/expense.types';
import TextField from '../../components/common/TextField';
import { formatCurrency } from '../../utils/format';

const ExpenseSummaryPage = () => {
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getExpenseSummary({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setSummary(result);
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <div className="mb-4">
        <Link to="/expenses" className="text-green-700 hover:underline text-sm">
          ← Back to expenses
        </Link>
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-1">Expense Summary</h2>
      <p className="text-sm text-gray-500 mb-6">
        Total business expenses, combining directly-recorded costs with transportation and
        labour costs already tracked in their own detailed records — each cost counted exactly
        once.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
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

      {isLoading || !summary ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading summary...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">Direct Expenses (this ledger)</span>
              <span className="text-gray-800 font-medium">
                {formatCurrency(summary.directExpensesTotal)}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">Transportation Costs (Transport Records)</span>
              <span className="text-gray-800 font-medium">
                {formatCurrency(summary.linkedTransportCostsTotal)}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">Labour Costs (Staff Assignments)</span>
              <span className="text-gray-800 font-medium">
                {formatCurrency(summary.linkedLabourCostsTotal)}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm bg-green-50">
              <span className="text-green-800 font-medium">Grand Total</span>
              <span className="text-green-900 font-semibold">
                {formatCurrency(summary.grandTotal)}
              </span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            By Category (this ledger)
          </h3>
          {summary.categories.length === 0 ? (
            <p className="text-sm text-gray-400">No direct expenses recorded in this range.</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">Category</th>
                    <th className="px-4 py-2 font-medium">Count</th>
                    <th className="px-4 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.categories.map((c) => (
                    <tr key={c.categoryId}>
                      <td className="px-4 py-3 text-gray-800">{c.categoryName}</td>
                      <td className="px-4 py-3 text-gray-500">{c.count}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {formatCurrency(c.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExpenseSummaryPage;
