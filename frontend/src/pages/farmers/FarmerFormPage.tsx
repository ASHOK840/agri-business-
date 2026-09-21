import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createFarmer, updateFarmer, getFarmer } from '../../services/farmerService';
import type { FarmerFormData, PossibleDuplicateFarmer } from '../../types/farmer.types';
import TextField from '../../components/common/TextField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const emptyForm: FarmerFormData = {
  farmerCode: '',
  name: '',
  phone: '',
  address: '',
  village: '',
};

interface FieldErrors {
  [field: string]: string;
}

const FarmerFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FarmerFormData>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<PossibleDuplicateFarmer | null>(null);

  useEffect(() => {
    if (isEditMode && id) {
      getFarmer(id).then((farmer) => {
        setForm({
          farmerCode: farmer.farmerCode,
          name: farmer.name,
          phone: farmer.phone || '',
          address: farmer.address || '',
          village: farmer.village || '',
        });
        setIsLoading(false);
      });
    }
  }, [id, isEditMode]);

  const handleChange =
    (field: keyof FarmerFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const submitFarmer = async (force = false) => {
    setFieldErrors({});
    setGeneralError('');
    setDuplicateWarning(null);
    setIsSaving(true);

    try {
      if (isEditMode && id) {
        await updateFarmer(id, form);
      } else {
        await createFarmer({ ...form, force });
      }
      navigate('/farmers');
    } catch (error: any) {
      const response = error?.response?.data;

      if (response?.code === 'POSSIBLE_DUPLICATE') {
        setDuplicateWarning(response.existingFarmer);
      } else if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save farmer.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitFarmer(false);
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading farmer...</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        {isEditMode ? 'Edit Farmer' : 'Add Farmer'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {isEditMode
          ? 'Update this farmer\'s details.'
          : 'Leave farmer code blank to auto-generate one.'}
      </p>

      {generalError && (
        <div className="mb-4">
          <Alert type="error" message={generalError} />
        </div>
      )}

      {duplicateWarning && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800 mb-3">
            A farmer with this name and phone number already exists:{' '}
            <strong>
              {duplicateWarning.name} ({duplicateWarning.farmerCode})
            </strong>
            . Is this a different person?
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDuplicateWarning(null)}>
              Cancel
            </Button>
            <Button onClick={() => submitFarmer(true)} isLoading={isSaving}>
              Yes, create anyway
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-4">
        <TextField
          label="Farmer Code"
          value={form.farmerCode}
          onChange={handleChange('farmerCode')}
          error={fieldErrors.farmerCode}
          placeholder={isEditMode ? undefined : 'Leave blank to auto-generate'}
          disabled={isEditMode}
        />
        <TextField
          label="Name"
          value={form.name}
          onChange={handleChange('name')}
          error={fieldErrors.name}
          required
        />
        <TextField
          label="Phone"
          value={form.phone}
          onChange={handleChange('phone')}
          error={fieldErrors.phone}
          placeholder="9876543210"
        />
        <TextField
          label="Village"
          value={form.village}
          onChange={handleChange('village')}
          error={fieldErrors.village}
        />
        <TextField
          label="Address"
          value={form.address}
          onChange={handleChange('address')}
          error={fieldErrors.address}
        />

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/farmers')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            {isEditMode ? 'Save Changes' : 'Add Farmer'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FarmerFormPage;
