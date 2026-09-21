import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDispatch, getCurrentStock } from '../../services/inventoryService';
import { listCrops } from '../../services/cropService';
import type { DispatchFormData } from '../../types/inventory.types';
import type { Crop } from '../../types/crop.types';
import type { CropStock } from '../../types/inventory.types';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { formatWeight } from '../../utils/format';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: DispatchFormData = {
  cropId: '',
  quantityKg: '',
  numberOfBags: '',
  movementDate: today(),
  notes: '',
};

interface FieldErrors {
  [field: string]: string;
}

const DispatchFormPage = () => {
  const navigate = useNavigate();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [stock, setStock] = useState<CropStock[]>([]);
  const [form, setForm] = useState<DispatchFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    listCrops({ limit: 100, status: 'ACTIVE' }).then((res) => setCrops(res.data));
    getCurrentStock({}).then(setStock);
  }, []);

  const handleChange =
    (field: keyof DispatchFormData) =>
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
      await createDispatch(form);
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
        setGeneralError(response?.message || 'Could not record dispatch.');
      }
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Dispatch Stock</h2>
      <p className="text-sm text-gray-500 mb-6">
        Records crop leaving the warehouse for sale. Blocked if it would
        exceed what's currently in stock.
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
              Currently in stock: {formatWeight(selectedStock.currentStockKg)} (
              {selectedStock.currentStockBags} bags)
            </p>
          )}
        </div>

        <TextField
          label="Quantity (kg) *"
          type="number"
          step="0.001"
          min="0"
          value={form.quantityKg}
          onChange={handleChange('quantityKg')}
          error={fieldErrors.quantityKg}
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
          label="Notes (optional)"
          value={form.notes}
          onChange={handleChange('notes')}
          error={fieldErrors.notes}
          placeholder="e.g. sold to AgroCorp Traders"
        />

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/inventory')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            Record Dispatch
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DispatchFormPage;
