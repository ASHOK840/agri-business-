import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createAssignment,
  updateAssignment,
  getAssignment,
} from '../../services/staffAssignmentService';
import { listPurchases } from '../../services/purchaseService';
import { listStaff } from '../../services/staffService';
import type { CreateAssignmentFormData } from '../../types/staffAssignment.types';
import type { Purchase } from '../../types/purchase.types';
import type { Staff } from '../../types/staff.types';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: CreateAssignmentFormData = {
  purchaseId: '',
  staffId: '',
  assignedDate: today(),
  bagsHandled: '',
  labourRatePerBag: '',
};

interface FieldErrors {
  [field: string]: string;
}

const AssignmentFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [form, setForm] = useState<CreateAssignmentFormData>(emptyForm);
  const [purchaseLabel, setPurchaseLabel] = useState('');
  const [staffLabel, setStaffLabel] = useState('');
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    if (!isEditMode) {
      listPurchases({ limit: 100 }).then((res) => setPurchases(res.data));
      listStaff({ limit: 100, status: 'ACTIVE' }).then((res) => setStaffList(res.data));
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode && id) {
      getAssignment(id).then((a) => {
        setForm({
          purchaseId: a.purchaseId,
          staffId: a.staffId,
          assignedDate: a.assignedDate.slice(0, 10),
          bagsHandled: a.bagsHandled?.toString() || '',
          labourRatePerBag: a.labourRatePerBag,
        });
        setPurchaseLabel(a.purchase.purchaseNumber);
        setStaffLabel(a.staff.name);
        setIsLoading(false);
      });
    }
  }, [id, isEditMode]);

  const handleChange =
    (field: keyof CreateAssignmentFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setIsSaving(true);

    try {
      if (isEditMode && id) {
        await updateAssignment(id, {
          assignedDate: form.assignedDate,
          bagsHandled: form.bagsHandled,
          labourRatePerBag: form.labourRatePerBag,
        });
      } else {
        await createAssignment(form);
      }
      navigate('/staff-assignments');
    } catch (error: any) {
      const response = error?.response?.data;
      if (response?.errors) {
        const mapped: FieldErrors = {};
        response.errors.forEach((e: { field: string; message: string }) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(response?.message || 'Could not save assignment.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-400">Loading assignment...</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        {isEditMode ? 'Edit Assignment' : 'Assign Staff'}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Labour amount is calculated automatically — bags handled × labour
        rate per bag.
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
        {isEditMode ? (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Purchase</label>
              <p className="text-sm text-gray-800">{purchaseLabel}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Staff</label>
              <p className="text-sm text-gray-800">{staffLabel}</p>
            </div>
          </>
        ) : (
          <>
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
                  {p.purchaseNumber} — {p.farmer.name} ({p.crop.name})
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Staff"
              value={form.staffId}
              onChange={handleChange('staffId')}
              error={fieldErrors.staffId}
              required
            >
              <option value="">Select a staff member</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.staffCode})
                </option>
              ))}
            </SelectField>
          </>
        )}

        <TextField
          label="Assigned Date *"
          type="date"
          value={form.assignedDate}
          onChange={handleChange('assignedDate')}
          error={fieldErrors.assignedDate}
          required
        />

        <TextField
          label="Bags Handled (optional)"
          type="number"
          step="1"
          min="0"
          value={form.bagsHandled}
          onChange={handleChange('bagsHandled')}
          error={fieldErrors.bagsHandled}
          hint="Leave blank if the job hasn't been done yet — fill in once bags are counted."
        />

        <TextField
          label="Labour Rate per Bag (₹) *"
          type="number"
          step="0.01"
          min="0"
          value={form.labourRatePerBag}
          onChange={handleChange('labourRatePerBag')}
          error={fieldErrors.labourRatePerBag}
          placeholder="5.00"
          required
        />

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="secondary" onClick={() => navigate('/staff-assignments')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} className="flex-1">
            {isEditMode ? 'Save Changes' : 'Assign Staff'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AssignmentFormPage;
