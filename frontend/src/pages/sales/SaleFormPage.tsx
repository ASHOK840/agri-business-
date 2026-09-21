import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSale } from '../../services/saleService';
import { listBuyers } from '../../services/buyerService';
import { listCrops } from '../../services/cropService';
import { getCurrentStock } from '../../services/inventoryService';
import type { Crop } from '../../types/crop.types';
import type { Buyer } from '../../types/buyer.types';
import type { CropStock } from '../../types/inventory.types';
import type { CreateSaleFormData } from '../../types/sale.types';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { formatCurrency, formatWeight } from '../../utils/format';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: CreateSaleFormData = {
  buyerId: '',
  cropId: '',
  warehouseId: '',
  quality: '',
  numberOfBags: '',
  dispatchWeightKg: '',
  sellingRatePerKg: '',
  saleDate: today(),
  status: 'PENDING',
  notes: '',
};

interface FieldErrors {
  [field: string]: string;
}

const SaleFormPage = () => {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [stock, setStock] = useState<CropStock[]>([]);
  const [form, setForm] = useState<CreateSaleFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    listBuyers({ limit: 100, status: 'ACTIVE' }).then((res) => setBuyers(res.data));
    listCrops({ limit: 100, status: 'ACTIVE' }).then((res) => setCrops(res.data));
    getCurrentStock({}).then(setStock);
  }, []);

  const handleChange =
    (field: keyof CreateSaleFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const selectedCropId = form.cropId;
  const selectedStock = stock.find((item) => item.cropId === selectedCropId);
  const expectedRevenue =
    Number(form.dispatchWeightKg || 0) * Number(form.sellingRatePerKg || 0);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      const { warehouseId, ...rest } = form;
      await createSale(warehouseId ? form : rest);
      navigate('/sales');
    } catch (error: any) {
      const response = error?.response?.data;
      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save sale.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Create Sale</h2>
      <p className="text-sm text-gray-500 mb-6">
        Warehouse stock is checked before a sale is saved. The selling rate is frozen in the sale
        and is not recalculated from market price later.
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
          label="Buyer"
          value={form.buyerId}
          onChange={handleChange('buyerId')}
          error={fieldErrors.buyerId}
          required
        >
          <option value="">Select a buyer</option>
          {buyers.map((buyer) => (
            <option key={buyer.id} value={buyer.id}>
              {buyer.companyName}
            </option>
          ))}
        </SelectField>

        <div>
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
          {selectedStock && (
            <p className="text-xs text-gray-500 mt-1">
              Available stock: {formatWeight(selectedStock.currentStockKg)}
            </p>
          )}
        </div>

        <TextField
          label="Quality / Grade (optional)"
          value={form.quality}
          onChange={handleChange('quality')}
          error={fieldErrors.quality}
          placeholder="Grade A"
        />

        <TextField
          label="Number of Bags (optional)"
          type="number"
          step="1"
          min="1"
          value={form.numberOfBags}
          onChange={handleChange('numberOfBags')}
          error={fieldErrors.numberOfBags}
        />

        <TextField
          label="Dispatch Weight (kg) *"
          type="number"
          step="0.001"
          min="0"
          value={form.dispatchWeightKg}
          onChange={handleChange('dispatchWeightKg')}
          error={fieldErrors.dispatchWeightKg}
          required
        />

        <TextField
          label="Selling Rate (₹ per kg) *"
          type="number"
          step="0.01"
          min="0"
          value={form.sellingRatePerKg}
          onChange={handleChange('sellingRatePerKg')}
          error={fieldErrors.sellingRatePerKg}
          required
        />

        <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
          Expected revenue: {formatCurrency(Number.isFinite(expectedRevenue) ? expectedRevenue : 0)}
        </div>

        <TextField
          label="Sale Date *"
          type="date"
          value={form.saleDate}
          onChange={handleChange('saleDate')}
          error={fieldErrors.saleDate}
          required
        />

        <TextField
          label="Notes (optional)"
          value={form.notes}
          onChange={handleChange('notes')}
          error={fieldErrors.notes}
        />

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/sales')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            Save Sale
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SaleFormPage;
