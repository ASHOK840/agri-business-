import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TextField from './TextField';
import Button from './Button';
import Alert from './Alert';

interface CodedFormData {
  [codeField: string]: string;
}

interface CodedMasterFormPageProps {
  title: string;
  codeField: string;
  codeLabel: string;
  listPath: string;
  api: {
    get: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
  };
}

const CodedMasterFormPage = ({
  title,
  codeField,
  codeLabel,
  listPath,
  api,
}: CodedMasterFormPageProps) => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<CodedFormData>({ [codeField]: '', name: '', phone: '' });
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      api.get(id).then((record) => {
        setForm({
          [codeField]: record[codeField],
          name: record.name,
          phone: record.phone || '',
        });
        setIsLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      if (isEditMode && id) {
        await api.update(id, form);
      } else {
        await api.create(form);
      }
      navigate(listPath);
    } catch (error: any) {
      const response = error?.response?.data;
      if (response?.errors) {
        const mapped: Record<string, string> = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        {isEditMode ? `Edit ${title}` : `Add ${title}`}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {isEditMode ? 'Update these details.' : `Leave ${codeLabel.toLowerCase()} blank to auto-generate one.`}
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
          label={codeLabel}
          value={form[codeField]}
          onChange={handleChange(codeField)}
          error={fieldErrors[codeField]}
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
          <Button type="button" variant="secondary" onClick={() => navigate(listPath)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            {isEditMode ? 'Save Changes' : 'Add'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CodedMasterFormPage;
