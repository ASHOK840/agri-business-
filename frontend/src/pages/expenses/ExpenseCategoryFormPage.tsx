import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createExpenseCategory,
  updateExpenseCategory,
  getExpenseCategory,
} from '../../services/expenseCategoryService';
import type { ExpenseCategoryFormData } from '../../types/expenseCategory.types';
import TextField from '../../components/common/TextField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const emptyForm: ExpenseCategoryFormData = {
  code: '',
  name: '',
  description: '',
  displayOrder: '0',
};

interface FieldErrors {
  [field: string]: string;
}

const ExpenseCategoryFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<ExpenseCategoryFormData>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      getExpenseCategory(id).then((category) => {
        setForm({
          code: category.code,
          name: category.name,
          description: category.description || '',
          displayOrder: category.displayOrder.toString(),
        });
        setIsLoading(false);
      });
    }
  }, [id, isEditMode]);

  const handleChange =
    (field: keyof ExpenseCategoryFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      if (isEditMode && id) {
        await updateExpenseCategory(id, form);
      } else {
        await createExpenseCategory(form);
      }
      navigate('/expense-categories');
    } catch (error: any) {
      const response = error?.response?.data;
      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save expense category.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        {isEditMode ? 'Edit Expense Category' : 'Add Expense Category'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        This becomes an option available when recording a business expense.
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
        <TextField
          label="Code"
          value={form.code}
          onChange={handleChange('code')}
          error={fieldErrors.code}
          placeholder="WAREHOUSE"
          required
        />
        <TextField
          label="Display Name"
          value={form.name}
          onChange={handleChange('name')}
          error={fieldErrors.name}
          placeholder="Warehouse Expenses"
          required
        />
        <TextField
          label="Description (optional)"
          value={form.description}
          onChange={handleChange('description')}
          error={fieldErrors.description}
        />
        <TextField
          label="Display Order"
          type="number"
          step="1"
          value={form.displayOrder}
          onChange={handleChange('displayOrder')}
          error={fieldErrors.displayOrder}
          hint="Lower numbers appear first in dropdowns."
        />

        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/expense-categories')}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            {isEditMode ? 'Save Changes' : 'Add Category'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseCategoryFormPage;
