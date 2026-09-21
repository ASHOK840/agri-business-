import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExpense } from '../../services/expenseService';
import { listExpenseCategories } from '../../services/expenseCategoryService';
import { listPurchases } from '../../services/purchaseService';
import { listSales } from '../../services/saleService';
import type { ExpenseFormData, PaymentMethod } from '../../types/expense.types';
import type { ExpenseCategory } from '../../types/expenseCategory.types';
import type { Purchase } from '../../types/purchase.types';
import type { Sale } from '../../types/sale.types';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const today = () => new Date().toISOString().slice(0, 10);

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

const emptyForm: ExpenseFormData = {
  categoryId: '',
  amount: '',
  expenseDate: today(),
  description: '',
  purchaseId: '',
  saleId: '',
  paymentMethod: '',
  referenceNumber: '',
};

interface FieldErrors {
  [field: string]: string;
}

const ExpenseFormPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [relatedType, setRelatedType] = useState<'NONE' | 'PURCHASE' | 'SALE'>('NONE');
  const [form, setForm] = useState<ExpenseFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    listExpenseCategories({ limit: 100, status: 'ACTIVE' }).then((res) => setCategories(res.data));
    listPurchases({ limit: 100 }).then((res) => setPurchases(res.data));
    listSales({ limit: 100 }).then((res) => setSales(res.data));
  }, []);

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const showLinkedCostHint =
    selectedCategory && ['TRANSPORTATION', 'LABOUR'].includes(selectedCategory.code);

  const handleChange =
    (field: keyof ExpenseFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleRelatedTypeChange = (type: 'NONE' | 'PURCHASE' | 'SALE') => {
    setRelatedType(type);
    setForm((prev) => ({ ...prev, purchaseId: '', saleId: '' }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      await createExpense(form);
      navigate('/expenses');
    } catch (error: any) {
      const response = error?.response?.data;
      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save expense.');
      }
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="max-w-xl mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Add Expense</h2>
      <p className="text-sm text-gray-500 mb-6">
        Record a business expense — transportation, labour, loading, unloading, warehouse, or
        miscellaneous costs.
      </p>

      {generalError && (
        <div className="mb-4">
          <Alert type="error" message={generalError} />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-4"
      >
        <div>
          <SelectField
            label="Category"
            value={form.categoryId}
            onChange={handleChange('categoryId')}
            error={fieldErrors.categoryId}
            required
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          {showLinkedCostHint && (
            <p className="text-xs text-amber-600 mt-1">
              This category already has detailed records (Staff Assignments / Transport Records)
              that are automatically included in the expense summary. Only add an entry here for
              a cost not already tracked there, to avoid counting it twice.
            </p>
          )}
        </div>

        <TextField
          label="Amount (₹) *"
          type="number"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={handleChange('amount')}
          error={fieldErrors.amount}
          required
        />

        <TextField
          label="Expense Date *"
          type="date"
          value={form.expenseDate}
          onChange={handleChange('expenseDate')}
          error={fieldErrors.expenseDate}
          required
        />

        <TextField
          label="Description (optional)"
          value={form.description}
          onChange={handleChange('description')}
          error={fieldErrors.description}
        />

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Related Record (optional)
          </label>
          <div className="flex gap-2 mb-2">
            {(['NONE', 'PURCHASE', 'SALE'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleRelatedTypeChange(type)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  relatedType === type
                    ? 'bg-green-700 text-white border-green-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-600 hover:text-green-700'
                }`}
              >
                {type === 'NONE' ? 'None' : type === 'PURCHASE' ? 'Purchase' : 'Sale'}
              </button>
            ))}
          </div>
          {relatedType === 'PURCHASE' && (
            <SelectField label="Purchase" value={form.purchaseId} onChange={handleChange('purchaseId')}>
              <option value="">Select a purchase</option>
              {purchases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.purchaseNumber} — {p.farmer.name}
                </option>
              ))}
            </SelectField>
          )}
          {relatedType === 'SALE' && (
            <SelectField label="Sale" value={form.saleId} onChange={handleChange('saleId')}>
              <option value="">Select a sale</option>
              {sales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.saleNumber} — {s.buyer.companyName}
                </option>
              ))}
            </SelectField>
          )}
        </div>

        <SelectField
          label="Payment Method"
          value={form.paymentMethod}
          onChange={handleChange('paymentMethod')}
          error={fieldErrors.paymentMethod}
          required
        >
          <option value="">Select a method</option>
          {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
            <option key={method} value={method}>
              {paymentMethodLabels[method]}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Reference Number (optional)"
          value={form.referenceNumber}
          onChange={handleChange('referenceNumber')}
          error={fieldErrors.referenceNumber}
          placeholder="Receipt no., UPI ref, etc."
        />

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/expenses')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            Save Expense
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseFormPage;
