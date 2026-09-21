import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransportRecord } from '../../services/transportRecordService';
import { transporterApi, driverApi, vehicleApi } from '../../services/transportMasterService';
import { listPurchases } from '../../services/purchaseService';
import { listBuyers } from '../../services/buyerService';
import { listCrops } from '../../services/cropService';
import { listUsers } from '../../services/userService';
import type { TransportRecordFormData, TransportDirection } from '../../types/transportRecord.types';
import type { Transporter, Driver, Vehicle } from '../../types/transportMaster.types';
import type { Purchase } from '../../types/purchase.types';
import type { Buyer } from '../../types/buyer.types';
import type { Crop } from '../../types/crop.types';
import type { ManagedUser } from '../../types/user.types';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: TransportRecordFormData = {
  direction: 'FARMER_TO_WAREHOUSE',
  transporterId: '',
  driverId: '',
  vehicleId: '',
  purchaseId: '',
  buyerId: '',
  cropId: '',
  assignedUserId: '',
  fromLocation: '',
  toLocation: '',
  numberOfBags: '',
  weightKg: '',
  transportCost: '',
  transportDate: today(),
  notes: '',
};

interface FieldErrors {
  [field: string]: string;
}

const TransportRecordFormPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<TransportRecordFormData>(emptyForm);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [transportUsers, setTransportUsers] = useState<ManagedUser[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    transporterApi.list({ limit: 100, status: 'ACTIVE' }).then((res) => setTransporters(res.data));
    driverApi.list({ limit: 100, status: 'ACTIVE' }).then((res) => setDrivers(res.data));
    vehicleApi.list({ limit: 100, status: 'ACTIVE' }).then((res) => setVehicles(res.data));
    listPurchases({ limit: 100 }).then((res) => setPurchases(res.data));
    listBuyers({ limit: 100, status: 'ACTIVE' }).then((res) => setBuyers(res.data));
    listCrops({ limit: 100, status: 'ACTIVE' }).then((res) => setCrops(res.data));
    listUsers('TRANSPORTATION').then(setTransportUsers);
  }, []);

  const handleChange =
    (field: keyof TransportRecordFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleDirectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const direction = event.target.value as TransportDirection;
    // Clear the other direction's reference field to avoid submitting a
    // stale purchaseId/buyerId that no longer matches the chosen route.
    setForm((prev) => ({
      ...prev,
      direction,
      purchaseId: direction === 'FARMER_TO_WAREHOUSE' ? prev.purchaseId : '',
      buyerId: direction === 'WAREHOUSE_TO_BUYER' ? prev.buyerId : '',
      fromLocation: direction === 'FARMER_TO_WAREHOUSE' ? prev.fromLocation : 'Main Warehouse',
      toLocation: direction === 'WAREHOUSE_TO_BUYER' ? prev.toLocation : 'Main Warehouse',
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      await createTransportRecord(form);
      navigate('/transport-records');
    } catch (error: any) {
      const response = error?.response?.data;
      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save transport record.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Record Transport</h2>
      <p className="text-sm text-gray-500 mb-6">
        Transport cost is recorded as its own expense here — it never
        changes the crop's purchase rate or total.
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
        <SelectField label="Direction" value={form.direction} onChange={handleDirectionChange}>
          <option value="FARMER_TO_WAREHOUSE">Farmer → Warehouse</option>
          <option value="WAREHOUSE_TO_BUYER">Warehouse → Buyer</option>
        </SelectField>

        {form.direction === 'FARMER_TO_WAREHOUSE' ? (
          <SelectField
            label="Purchase"
            value={form.purchaseId}
            onChange={handleChange('purchaseId')}
            error={fieldErrors.purchaseId}
            required
          >
            <option value="">Select a purchase</option>
            {purchases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.purchaseNumber} — {p.farmer.name}
              </option>
            ))}
          </SelectField>
        ) : (
          <SelectField
            label="Buyer"
            value={form.buyerId}
            onChange={handleChange('buyerId')}
            error={fieldErrors.buyerId}
            required
          >
            <option value="">Select a buyer</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.companyName}
              </option>
            ))}
          </SelectField>
        )}

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

        <SelectField
          label="Transporter"
          value={form.transporterId}
          onChange={handleChange('transporterId')}
          error={fieldErrors.transporterId}
          required
        >
          <option value="">Select a transporter</option>
          {transporters.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </SelectField>

        <SelectField label="Driver (optional)" value={form.driverId} onChange={handleChange('driverId')}>
          <option value="">Not assigned yet</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </SelectField>

        <SelectField label="Vehicle (optional)" value={form.vehicleId} onChange={handleChange('vehicleId')}>
          <option value="">Not assigned yet</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.vehicleNumber}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Assigned Transportation User (optional)"
          value={form.assignedUserId}
          onChange={handleChange('assignedUserId')}
          hint="This login will see the trip on their own 'My Trips' screen and can start/deliver it."
        >
          <option value="">Not assigned yet</option>
          {transportUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </SelectField>

        <TextField
          label="From Location *"
          value={form.fromLocation}
          onChange={handleChange('fromLocation')}
          error={fieldErrors.fromLocation}
          required
        />
        <TextField
          label="To Location *"
          value={form.toLocation}
          onChange={handleChange('toLocation')}
          error={fieldErrors.toLocation}
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
          label="Weight (kg, optional)"
          type="number"
          step="0.001"
          value={form.weightKg}
          onChange={handleChange('weightKg')}
          error={fieldErrors.weightKg}
        />

        <TextField
          label="Transport Cost (₹) *"
          type="number"
          step="0.01"
          min="0"
          value={form.transportCost}
          onChange={handleChange('transportCost')}
          error={fieldErrors.transportCost}
          hint="This becomes a business expense, kept separate from the crop's purchase rate."
          required
        />

        <TextField
          label="Transport Date *"
          type="date"
          value={form.transportDate}
          onChange={handleChange('transportDate')}
          error={fieldErrors.transportDate}
          required
        />

        <TextField
          label="Notes (optional)"
          value={form.notes}
          onChange={handleChange('notes')}
          error={fieldErrors.notes}
        />

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/transport-records')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            Record Transport
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TransportRecordFormPage;
