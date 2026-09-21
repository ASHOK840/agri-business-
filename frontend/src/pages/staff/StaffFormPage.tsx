import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createStaff, updateStaff, getStaff } from '../../services/staffService';
import type { StaffFormData } from '../../types/staff.types';
import TextField from '../../components/common/TextField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const emptyForm: StaffFormData = {
  staffCode: '',
  name: '',
  phone: '',
};

interface FieldErrors {
  [field: string]: string;
}

const StaffFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<StaffFormData>(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      getStaff(id).then((member) => {
        setForm({
          staffCode: member.staffCode,
          name: member.name,
          phone: member.phone || '',
        });
        setIsLoading(false);
      });
    }
  }, [id, isEditMode]);

  const handleChange =
    (field: keyof StaffFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      if (isEditMode && id) {
        await updateStaff(id, form);
      } else {
        await createStaff(form);
      }
      navigate('/staff');
    } catch (error: any) {
      const response = error?.response?.data;

      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save staff member.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading staff member...</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        {isEditMode ? 'Edit Staff' : 'Add Staff'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {isEditMode
          ? "Update this staff member's details."
          : 'Leave staff code blank to auto-generate one.'}
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
          label="Staff Code"
          value={form.staffCode}
          onChange={handleChange('staffCode')}
          error={fieldErrors.staffCode}
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

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/staff')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            {isEditMode ? 'Save Changes' : 'Add Staff'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StaffFormPage;
