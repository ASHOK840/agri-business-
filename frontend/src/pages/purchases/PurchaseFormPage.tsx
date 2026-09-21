import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPurchase } from '../../services/purchaseService';
import { listFarmers } from '../../services/farmerService';
import { listCrops } from '../../services/cropService';
import type { CreatePurchaseFormData } from '../../types/purchase.types';
import type { Farmer } from '../../types/farmer.types';
import type { Crop } from '../../types/crop.types';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: CreatePurchaseFormData = {
  farmerId: '',
  cropId: '',
  quality: '',
  purchaseRatePerKg: '',
  estimatedQuantityKg: '',
  bagWeightKg: '',
  purchaseDate: today(),
  advanceAmount: '',
  notes: '',
};

interface FieldErrors {
  [field: string]: string;
}

const PurchaseFormPage = () => {
  const navigate = useNavigate();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [form, setForm] = useState<CreatePurchaseFormData>(emptyForm);
  // Calculator helper only — number of bags isn't recorded at this
  // stage (the actual count is captured later when the purchase is
  // weighed). It just exists here to fill in Estimated Quantity for you.
  const [bagsForCalc, setBagsForCalc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    listFarmers({ limit: 100, status: 'ACTIVE' }).then((res) => setFarmers(res.data));
    listCrops({ limit: 100, status: 'ACTIVE' }).then((res) => setCrops(res.data));
  }, []);

  const handleChange =
    (field: keyof CreatePurchaseFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  // Bags × bag weight = estimated quantity. This only ever WRITES to
  // estimatedQuantityKg when there's a real bag count to calculate
  // from — if the field is left blank, typing a total directly still
  // works exactly as before.
  const recalcQuantityFromBags = (bags: string, bagWeight: string) => {
    const bagsNum = Number(bags);
    const weightNum = Number(bagWeight);
    if (bags && bagWeight && bagsNum > 0 && weightNum > 0) {
      const computed = Math.round(bagsNum * weightNum * 1000) / 1000;
      setForm((prev) => ({ ...prev, estimatedQuantityKg: String(computed) }));
    }
  };

  const handleBagsForCalcChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const bags = event.target.value;
    setBagsForCalc(bags);
    recalcQuantityFromBags(bags, form.bagWeightKg);
  };

  const handleBagWeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const bagWeight = event.target.value;
    setForm((prev) => ({ ...prev, bagWeightKg: bagWeight }));
    recalcQuantityFromBags(bagsForCalc, bagWeight);
  };

  // When a crop is picked, pre-fill the bag weight field with that
  // crop's configured default — but this is just a starting suggestion
  // in the form; the actual value sent is whatever the user leaves/edits
  // here, and it becomes this purchase's own frozen value on save.
  const handleCropChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const cropId = event.target.value;
    const selectedCrop = crops.find((c) => c.id === cropId);
    const nextBagWeight = selectedCrop ? String(Number(selectedCrop.defaultBagWeightKg)) : form.bagWeightKg;
    setForm((prev) => ({ ...prev, cropId, bagWeightKg: nextBagWeight }));
    recalcQuantityFromBags(bagsForCalc, nextBagWeight);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      await createPurchase(form);
      navigate('/purchases');
    } catch (error: any) {
      const response = error?.response?.data;

      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save purchase.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">New Purchase</h2>
      <p className="text-sm text-gray-500 mb-6">
        The rate you enter here is locked in for this purchase — it won't
        change even if crop market prices change later.
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
          label="Farmer"
          value={form.farmerId}
          onChange={handleChange('farmerId')}
          error={fieldErrors.farmerId}
          required
        >
          <option value="">Select a farmer</option>
          {farmers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.farmerCode})
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Crop"
          value={form.cropId}
          onChange={handleCropChange}
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

        <TextField
          label="Quality / Grade (optional)"
          value={form.quality}
          onChange={handleChange('quality')}
          error={fieldErrors.quality}
          placeholder="Grade A"
        />

        <TextField
          label="Purchase Rate (₹ per kg) *"
          type="number"
          step="0.01"
          min="0"
          value={form.purchaseRatePerKg}
          onChange={handleChange('purchaseRatePerKg')}
          error={fieldErrors.purchaseRatePerKg}
          placeholder="30.00"
          required
        />

        <TextField
          label="Bag Weight (kg)"
          type="number"
          step="0.001"
          min="0"
          value={form.bagWeightKg}
          onChange={handleBagWeightChange}
          error={fieldErrors.bagWeightKg}
          hint="Defaults from the crop's standard bag weight — adjust if this lot differs."
        />

        <TextField
          label="Number of Bags (optional)"
          type="number"
          step="1"
          min="0"
          value={bagsForCalc}
          onChange={handleBagsForCalcChange}
          hint="Fills in Estimated Quantity below for you (bags × bag weight). Not saved separately — the actual bag count is recorded when the purchase is weighed."
          placeholder="e.g. 5"
        />

        <TextField
          label="Estimated Quantity (kg)"
          type="number"
          step="0.001"
          min="0"
          value={form.estimatedQuantityKg}
          onChange={handleChange('estimatedQuantityKg')}
          error={fieldErrors.estimatedQuantityKg}
          hint="Auto-filled from bags above, or type a total directly. Actual quantity is recorded later once weighed."
          placeholder="500"
        />

        <TextField
          label="Purchase Date *"
          type="date"
          value={form.purchaseDate}
          onChange={handleChange('purchaseDate')}
          error={fieldErrors.purchaseDate}
          required
        />

        <TextField
          label="Advance Paid (₹, optional)"
          type="number"
          step="0.01"
          min="0"
          value={form.advanceAmount}
          onChange={handleChange('advanceAmount')}
          error={fieldErrors.advanceAmount}
          placeholder="0"
        />

        <TextField
          label="Notes (optional)"
          value={form.notes}
          onChange={handleChange('notes')}
          error={fieldErrors.notes}
        />

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/purchases')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            Create Purchase
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseFormPage;
