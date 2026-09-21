import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExpense, updateExpense, cancelExpense } from '../../services/expenseService';
import { listExpenseCategories } from '../../services/expenseCategoryService';
import type { Expense, ExpenseFormData, PaymentMethod } from '../../types/expense.types';
import type { ExpenseCategory } from '../../types/expenseCategory.types';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import { formatCurrency, formatDate } from '../../utils/format';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

const ExpenseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<ExpenseFormData>({
    categoryId: '',
    amount: '',
    expenseDate: '',
    description: '',
    purchaseId: '',
    saleId: '',
    paymentMethod: '',
    referenceNumber: '',
  });

  const loadExpense = () => {
    if (!id) return;
    getExpense(id)
      .then((e) => {
        setExpense(e);
        setForm({
          categoryId: e.categoryId,
          amount: e.amount,
          expenseDate: e.expenseDate.slice(0, 10),
          description: e.description || '',
          purchaseId: e.purchaseId || '',
          saleId: e.saleId || '',
          paymentMethod: e.paymentMethod,
          referenceNumber: e.referenceNumber || '',
        });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(loadExpense, [id]);
  useEffect(() => {
    listExpenseCategories({ limit: 100 }).then((res) => setCategories(res.data));
  }, []);

  const isCancelled = expense?.status === 'CANCELLED';

  const handleChange =
    (field: keyof ExpenseFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSaveDetails = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await updateExpense(id, form);
      setExpense(updated);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Expense updated.' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not save changes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelExpense = async (event: FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setIsCancelling(true);
    setMessage(null);
    try {
      const updated = await cancelExpense(id, cancellationReason);
      setExpense(updated);
      setShowCancelForm(false);
      setMessage({ type: 'success', text: 'Expense cancelled.' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not cancel expense.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading expense..." />;
  }

  if (!expense) {
    return (
      <div className="max-w-2xl mx-auto mt-10 text-center text-gray-500">
        Expense not found.{' '}
        <Link to="/expenses" className="text-green-700 hover:underline">
          Back to expense list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <Link to="/expenses" className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to Expenses
      </Link>

      <div className="flex items-start justify-between mt-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{expense.expenseNumber}</h2>
          <p className="text-sm text-gray-500">{expense.category.name}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            isCancelled ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {expense.status}
        </span>
      </div>

      {message && (
        <div className="mb-4">
          <Alert type={message.type} message={message.text} />
        </div>
      )}

      {isCancelled && expense.cancellationReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-800">
          <p className="font-medium mb-1">
            Cancelled by {expense.cancelledByUser?.name}
            {expense.cancelledAt ? ` on ${formatDate(expense.cancelledAt)}` : ''}
          </p>
          <p>{expense.cancellationReason}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Details</h3>
        {!isCancelled && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-green-700 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form
          onSubmit={handleSaveDetails}
          className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-4 mb-6"
        >
          <SelectField
            label="Category"
            value={form.categoryId}
            onChange={handleChange('categoryId')}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Amount (₹)"
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={handleChange('amount')}
          />
          <TextField
            label="Expense Date"
            type="date"
            value={form.expenseDate}
            onChange={handleChange('expenseDate')}
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={handleChange('description')}
          />
          <SelectField label="Payment Method" value={form.paymentMethod} onChange={handleChange('paymentMethod')}>
            {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
              <option key={method} value={method}>
                {paymentMethodLabels[method]}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Reference Number"
            value={form.referenceNumber}
            onChange={handleChange('referenceNumber')}
          />

          <div className="flex gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
          {[
            ['Amount', formatCurrency(expense.amount)],
            ['Date', formatDate(expense.expenseDate)],
            ['Description', expense.description || '—'],
            [
              'Related Record',
              expense.purchase
                ? `Purchase ${expense.purchase.purchaseNumber}`
                : expense.sale
                  ? `Sale ${expense.sale.saleNumber}`
                  : '—',
            ],
            ['Payment Method', paymentMethodLabels[expense.paymentMethod]],
            ['Reference Number', expense.referenceNumber || '—'],
            ['Created By', expense.createdByUser.name],
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="text-gray-800 font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {!isCancelled && !isEditing && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Cancel Expense
          </h3>
          {showCancelForm ? (
            <form
              onSubmit={handleCancelExpense}
              className="bg-white rounded-lg border border-red-200 p-4 flex flex-col gap-3"
            >
              <TextField
                label="Cancellation Reason (optional)"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. entered in error, duplicate of EXP-2026-0004"
              />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowCancelForm(false)}>
                  Back
                </Button>
                <Button type="submit" variant="danger" isLoading={isCancelling} className="flex-1">
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="danger" onClick={() => setShowCancelForm(true)}>
              Cancel This Expense
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseDetailPage;
