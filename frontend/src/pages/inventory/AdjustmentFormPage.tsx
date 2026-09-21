import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAdjustment, getCurrentStock } from '../../services/inventoryService';
import { listCrops } from '../../services/cropService';
import type { AdjustmentFormData, CropStock } from '../../types/inventory.types';
import type { Crop } from '../../types/crop.types';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { formatWeight } from '../../utils/format';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: AdjustmentFormData = {
  cropId: '',
  quantityKg: '',
  numberOfBags: '',
  movementDate: today(),
  notes: '',
};

interface FieldErrors {
  [field: string]: string;
}

const AdjustmentFormPage = () => {
  const navigate = useNavigate();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [stock, setStock] = useState<CropStock[]>([]);
  const [form, setForm] = useState<AdjustmentFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    listCrops({ limit: 100, status: 'ACTIVE' }).then((res) => setCrops(res.data));
    getCurrentStock({}).then(setStock);
  }, []);

  const handleChange =
    (field: keyof AdjustmentFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const selectedStock = stock.find((s) => s.cropId === form.cropId);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      await createAdjustment(form);
      navigate('/inventory');
    } catch (error: any) {
      const response = error?.response?.data;
      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not record adjustment.');
      }
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Stock Adjustment</h2>
      <p className="text-sm text-gray-500 mb-6">
        For correcting stock levels — spoilage, counting errors, etc.
        This bypasses the normal availability check, so a reason is
        required. Owner-only.
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
            label="Crop"
            value={form.cropId}
            onChange={handleChange('cropId')}
            error={fieldErrors.cropId}
            required
          >
            <option value="">Select a crop</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          {selectedStock && (
            <p className="text-xs text-gray-400 mt-1">
              Currently calculated stock: {formatWeight(selectedStock.currentStockKg)}
            </p>
          )}
        </div>

        <TextField
          label="Adjustment Quantity (kg) *"
          type="number"
          step="0.001"
          value={form.quantityKg}
          onChange={handleChange('quantityKg')}
          error={fieldErrors.quantityKg}
          hint="Use a negative number to reduce stock (e.g. -50 for spoilage), positive to increase it."
          placeholder="-50 or 50"
          required
        />

        <TextField
          label="Number of Bags (optional)"
          type="number"
          step="1"
          value={form.numberOfBags}
          onChange={handleChange('numberOfBags')}
          error={fieldErrors.numberOfBags}
        />

        <TextField
          label="Date *"
          type="date"
          value={form.movementDate}
          onChange={handleChange('movementDate')}
          error={fieldErrors.movementDate}
          required
        />

        <TextField
          label="Reason *"
          value={form.notes}
          onChange={handleChange('notes')}
          error={fieldErrors.notes}
          placeholder="e.g. Spoilage found during inspection"
          required
        />

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/inventory')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            Record Adjustment
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdjustmentFormPage;
