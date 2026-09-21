import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCropPrice } from '../../services/cropPriceService';
import { listCrops } from '../../services/cropService';
import { listBuyers } from '../../services/buyerService';
import type { CropPriceFormData } from '../../types/cropPrice.types';
import type { Crop } from '../../types/crop.types';
import type { Buyer } from '../../types/buyer.types';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: CropPriceFormData = {
  cropId: '',
  buyerId: '',
  quality: '',
  pricePerKg: '',
  effectiveDate: today(),
  sourceType: 'MARKET',
  notes: '',
};

interface FieldErrors {
  [field: string]: string;
}

const CropPriceFormPage = () => {
  const navigate = useNavigate();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [form, setForm] = useState<CropPriceFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    listCrops({ limit: 100, status: 'ACTIVE' }).then((res) => setCrops(res.data));
    listBuyers({ limit: 100, status: 'ACTIVE' }).then((res) => setBuyers(res.data));
  }, []);

  const handleChange =
    (field: keyof CropPriceFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      await createCropPrice(form);
      navigate('/crop-prices');
    } catch (error: any) {
      const response = error?.response?.data;

      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save price.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Add Crop Price</h2>
      <p className="text-sm text-gray-500 mb-6">
        This records a new price entry — it never changes or replaces past
        prices, which stay exactly as they were recorded.
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
        <SelectField
          label="Crop"
          value={form.cropId}
          onChange={handleChange('cropId')}
          error={fieldErrors.cropId}
          required
        >
          <option value="">Select a crop</option>
          {crops.map((crop) => (
            <option key={crop.id} value={crop.id}>
              {crop.name}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Buyer (optional)"
          value={form.buyerId}
          onChange={handleChange('buyerId')}
          error={fieldErrors.buyerId}
        >
          <option value="">General market rate (no specific buyer)</option>
          {buyers.map((buyer) => (
            <option key={buyer.id} value={buyer.id}>
              {buyer.companyName}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Price per kg (₹)"
          type="number"
          step="0.01"
          min="0"
          value={form.pricePerKg}
          onChange={handleChange('pricePerKg')}
          error={fieldErrors.pricePerKg}
          placeholder="32.50"
          required
        />

        <TextField
          label="Effective Date"
          type="date"
          value={form.effectiveDate}
          onChange={handleChange('effectiveDate')}
          error={fieldErrors.effectiveDate}
          required
        />

        <TextField
          label="Quality / Grade (optional)"
          value={form.quality}
          onChange={handleChange('quality')}
          error={fieldErrors.quality}
          placeholder="Grade A"
        />

        <SelectField label="Source / Type" value={form.sourceType} onChange={handleChange('sourceType')}>
          <option value="MARKET">Market Rate</option>
          <option value="BUYER_QUOTE">Buyer Quote</option>
          <option value="MANUAL">Manual Note</option>
        </SelectField>

        <TextField
          label="Notes (optional)"
          value={form.notes}
          onChange={handleChange('notes')}
          error={fieldErrors.notes}
          placeholder="e.g. heard from mandi agent"
        />

        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/crop-prices')}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            Save Price
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CropPriceFormPage;
