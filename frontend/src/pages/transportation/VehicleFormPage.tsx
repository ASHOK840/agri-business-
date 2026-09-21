import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vehicleApi } from '../../services/transportMasterService';
import TextField from '../../components/common/TextField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

interface FieldErrors {
  [field: string]: string;
}

const VehicleFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ vehicleNumber: '', vehicleType: '' });
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      vehicleApi.get(id).then((v) => {
        setForm({ vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType || '' });
        setIsLoading(false);
      });
    }
  }, [id, isEditMode]);

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      if (isEditMode && id) {
        await vehicleApi.update(id, form);
      } else {
        await vehicleApi.create(form);
      }
      navigate('/vehicles');
    } catch (error: any) {
      const response = error?.response?.data;
      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save vehicle.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading vehicle...</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        {isEditMode ? 'Edit Vehicle' : 'Add Vehicle'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        The vehicle number itself is the unique identifier — no separate code needed.
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
          label="Vehicle Number"
          value={form.vehicleNumber}
          onChange={handleChange('vehicleNumber')}
          error={fieldErrors.vehicleNumber}
          placeholder="TN-01-AB-1234"
          required
        />
        <TextField
          label="Vehicle Type (optional)"
          value={form.vehicleType}
          onChange={handleChange('vehicleType')}
          error={fieldErrors.vehicleType}
          placeholder="Truck"
        />

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/vehicles')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            {isEditMode ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VehicleFormPage;
