import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createQualityStatus,
  updateQualityStatus,
  getQualityStatus,
} from '../../services/qualityStatusService';
import type { QualityStatusFormData } from '../../types/qualityStatus.types';
import TextField from '../../components/common/TextField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const emptyForm: QualityStatusFormData = {
  code: '',
  name: '',
  description: '',
  isRejection: false,
  displayOrder: '0',
};

interface FieldErrors {
  [field: string]: string;
}

const QualityStatusFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<QualityStatusFormData>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      getQualityStatus(id).then((qs) => {
        setForm({
          code: qs.code,
          name: qs.name,
          description: qs.description || '',
          isRejection: qs.isRejection,
          displayOrder: qs.displayOrder.toString(),
        });
        setIsLoading(false);
      });
    }
  }, [id, isEditMode]);

  const handleChange =
    (field: keyof QualityStatusFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      if (isEditMode && id) {
        await updateQualityStatus(id, form);
      } else {
        await createQualityStatus(form);
      }
      navigate('/quality-statuses');
    } catch (error: any) {
      const response = error?.response?.data;
      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save quality status.');
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
        {isEditMode ? 'Edit Quality Status' : 'Add Quality Status'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        This becomes an option staff can select when recording a crop's
        quality.
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
          placeholder="GOOD"
          required
        />
        <TextField
          label="Display Name"
          value={form.name}
          onChange={handleChange('name')}
          error={fieldErrors.name}
          placeholder="Good"
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

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isRejection}
            onChange={(e) => setForm((prev) => ({ ...prev, isRejection: e.target.checked }))}
            className="rounded border-gray-300"
          />
          This status represents a rejection (requires a written reason when used)
        </label>

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/quality-statuses')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            {isEditMode ? 'Save Changes' : 'Add Status'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QualityStatusFormPage;
