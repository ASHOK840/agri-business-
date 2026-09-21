import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createBuyer, updateBuyer, getBuyer } from '../../services/buyerService';
import type { BuyerFormData } from '../../types/buyer.types';
import TextField from '../../components/common/TextField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const emptyForm: BuyerFormData = {
  buyerCode: '',
  companyName: '',
  contactPerson: '',
  phone: '',
  address: '',
};

interface FieldErrors {
  [field: string]: string;
}

const BuyerFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<BuyerFormData>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      getBuyer(id).then((buyer) => {
        setForm({
          buyerCode: buyer.buyerCode,
          companyName: buyer.companyName,
          contactPerson: buyer.contactPerson || '',
          phone: buyer.phone || '',
          address: buyer.address || '',
        });
        setIsLoading(false);
      });
    }
  }, [id, isEditMode]);

  const handleChange =
    (field: keyof BuyerFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      if (isEditMode && id) {
        await updateBuyer(id, form);
      } else {
        await createBuyer(form);
      }
      navigate('/buyers');
    } catch (error: any) {
      const response = error?.response?.data;

      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save buyer.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading buyer...</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        {isEditMode ? 'Edit Buyer' : 'Add Buyer'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {isEditMode
          ? "Update this buyer's details."
          : 'Leave buyer code blank to auto-generate one.'}
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
          label="Buyer Code"
          value={form.buyerCode}
          onChange={handleChange('buyerCode')}
          error={fieldErrors.buyerCode}
          placeholder={isEditMode ? undefined : 'Leave blank to auto-generate'}
          disabled={isEditMode}
        />
        <TextField
          label="Company Name"
          value={form.companyName}
          onChange={handleChange('companyName')}
          error={fieldErrors.companyName}
          required
        />
        <TextField
          label="Contact Person"
          value={form.contactPerson}
          onChange={handleChange('contactPerson')}
          error={fieldErrors.contactPerson}
        />
        <TextField
          label="Phone"
          value={form.phone}
          onChange={handleChange('phone')}
          error={fieldErrors.phone}
          placeholder="9876543210"
        />
        <TextField
          label="Address"
          value={form.address}
          onChange={handleChange('address')}
          error={fieldErrors.address}
        />

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/buyers')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            {isEditMode ? 'Save Changes' : 'Add Buyer'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BuyerFormPage;
