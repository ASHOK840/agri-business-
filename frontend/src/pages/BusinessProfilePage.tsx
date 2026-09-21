import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getBusinessProfile,
  saveBusinessProfile,
  uploadBusinessLogo,
} from '../services/businessProfileService';
import type { BusinessProfileFormData } from '../types/businessProfile.types';
import TextField from '../components/common/TextField';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import LoadingState from '../components/common/LoadingState';
import PageHeader from '../components/common/PageHeader';

const emptyForm: BusinessProfileFormData = {
  businessName: '',
  ownerName: '',
  phone: '',
  address: '',
  pan: '',
  gstin: '',
  email: '',
};

interface FieldErrors {
  [field: string]: string;
}

const BusinessProfilePage = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'ADMIN';

  const [form, setForm] = useState<BusinessProfileFormData>(emptyForm);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [profileExists, setProfileExists] = useState(false);

  useEffect(() => {
    getBusinessProfile()
      .then((profile) => {
        if (profile) {
          setForm({
            businessName: profile.businessName,
            ownerName: profile.ownerName,
            phone: profile.phone || '',
            address: profile.address || '',
            pan: profile.pan || '',
            gstin: profile.gstin || '',
            email: profile.email || '',
          });
          setLogoUrl(profile.logoUrl);
          setProfileExists(true);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (field: keyof BusinessProfileFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setSaveMessage(null);
    setIsSaving(true);

    try {
      await saveBusinessProfile(form);
      setProfileExists(true);
      setSaveMessage({ type: 'success', text: 'Business profile saved successfully.' });
    } catch (error: any) {
      const errors = error?.response?.data?.errors as { field: string; message: string }[] | undefined;

      if (errors && errors.length > 0) {
        const mapped: FieldErrors = {};
        errors.forEach((e) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
        setSaveMessage({ type: 'error', text: 'Please fix the errors below.' });
      } else {
        setSaveMessage({
          type: 'error',
          text: error?.response?.data?.message || 'Could not save business profile.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setSaveMessage(null);

    try {
      const updated = await uploadBusinessLogo(file);
      setLogoUrl(updated.logoUrl);
      setSaveMessage({ type: 'success', text: 'Logo uploaded successfully.' });
    } catch (error: any) {
      setSaveMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not upload logo.',
      });
    } finally {
      setIsUploadingLogo(false);
      event.target.value = '';
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading business profile..." />;
  }

  // Read-only view for STAFF (or anyone without OWNER role)
  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto mt-6">
        <PageHeader title="Business Profile" subtitle="Reference details shown on bills and receipts." />
        {!profileExists ? (
          <Alert type="error" message="The business profile has not been configured yet." />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {[
              ['Business Name', form.businessName],
              ['Owner Name', form.ownerName],
              ['Phone', form.phone || '—'],
              ['Address', form.address || '—'],
              ['PAN', form.pan || '—'],
              ['GSTIN', form.gstin || '—'],
              ['Email', form.email || '—'],
            ].map(([label, value]) => (
              <div key={label} className="px-4 py-3 flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-800 font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-3">
          Only the business owner can edit this information.
        </p>
      </div>
    );
  }

  // Editable form for OWNER
  return (
    <div className="max-w-2xl mx-auto mt-6 mb-10">
      <PageHeader title="Business Profile" subtitle="This information appears on your bills and receipts." />

      {saveMessage && (
        <div className="mb-4">
          <Alert type={saveMessage.type} message={saveMessage.text} />
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Logo */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="h-20 w-20 rounded-full bg-gray-50 border-2 border-green-100 flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${logoUrl}`}
                alt="Business logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-400 text-center px-1">No logo</span>
            )}
          </div>
          <div>
            <label className="inline-block">
              <span className="sr-only">Upload logo</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoSelect}
                disabled={isUploadingLogo || !profileExists}
                className="text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-green-50 file:text-green-800 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-green-100"
              />
            </label>
            <p className="text-xs text-gray-400 mt-1">
              {profileExists
                ? 'PNG, JPEG, WEBP or SVG. Max 2MB.'
                : 'Save your business details first, then upload a logo.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Business Name"
              value={form.businessName}
              onChange={handleChange('businessName')}
              error={fieldErrors.businessName}
              required
            />
            <TextField
              label="Owner Name"
              value={form.ownerName}
              onChange={handleChange('ownerName')}
              error={fieldErrors.ownerName}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Phone"
              value={form.phone}
              onChange={handleChange('phone')}
              error={fieldErrors.phone}
              placeholder="9876543210"
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              error={fieldErrors.email}
            />
          </div>

          <TextField
            label="Address"
            value={form.address}
            onChange={handleChange('address')}
            error={fieldErrors.address}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="PAN"
              value={form.pan}
              onChange={handleChange('pan')}
              error={fieldErrors.pan}
              placeholder="ABCDE1234F"
              hint="Used on official business documents."
            />
            <TextField
              label="GSTIN (if applicable)"
              value={form.gstin}
              onChange={handleChange('gstin')}
              error={fieldErrors.gstin}
              placeholder="33ABCDE1234F1Z5"
            />
          </div>

          <Button type="submit" isLoading={isSaving} className="w-full mt-2">
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BusinessProfilePage;
