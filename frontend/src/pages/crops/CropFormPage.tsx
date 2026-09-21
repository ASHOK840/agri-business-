import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCrop, updateCrop, getCrop } from '../../services/cropService';
import type { CropFormData } from '../../types/crop.types';
import TextField from '../../components/common/TextField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const emptyForm: CropFormData = {
  cropCode: '',
  name: '',
  defaultBagWeightKg: '42',
  lowStockThresholdKg: '',
};

interface FieldErrors {
  [field: string]: string;
}

const CropFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<CropFormData>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      getCrop(id).then((crop) => {
        setForm({
          cropCode: crop.cropCode,
          name: crop.name,
          defaultBagWeightKg: crop.defaultBagWeightKg,
          lowStockThresholdKg: crop.lowStockThresholdKg || '',
        });
        setIsLoading(false);
      });
    }
  }, [id, isEditMode]);

  const handleChange =
    (field: keyof CropFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      if (isEditMode && id) {
        await updateCrop(id, form);
      } else {
        await createCrop(form);
      }
      navigate('/crops');
    } catch (error: any) {
      const response = error?.response?.data;

      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save crop.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading crop...</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        {isEditMode ? 'Edit Crop' : 'Add Crop'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Bag weight defaults to 42kg but can be set per crop.
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
          label="Crop Code"
          value={form.cropCode}
          onChange={handleChange('cropCode')}
          error={fieldErrors.cropCode}
          placeholder="RICE"
          required
        />
        <TextField
          label="Crop Name"
          value={form.name}
          onChange={handleChange('name')}
          error={fieldErrors.name}
          placeholder="Rice"
          required
        />
        <TextField
          label="Default Bag Weight (kg)"
          type="number"
          step="0.001"
          min="0"
          value={form.defaultBagWeightKg}
          onChange={handleChange('defaultBagWeightKg')}
          error={fieldErrors.defaultBagWeightKg}
          hint="Standard is 42kg, but adjust per crop if needed."
          required
        />
        <TextField
          label="Low Stock Threshold (kg, optional)"
          type="number"
          step="0.001"
          min="0"
          value={form.lowStockThresholdKg}
          onChange={handleChange('lowStockThresholdKg')}
          error={fieldErrors.lowStockThresholdKg}
          hint="Inventory will show a low-stock warning once stock falls below this."
        />

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/crops')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            {isEditMode ? 'Save Changes' : 'Add Crop'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CropFormPage;
