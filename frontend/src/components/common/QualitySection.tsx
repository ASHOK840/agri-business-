import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listQualityRecords,
  createQualityRecord,
} from '../../services/qualityRecordService';
import { listQualityStatuses } from '../../services/qualityStatusService';
import type { QualityRecord, QualityRecordFormData } from '../../types/qualityRecord.types';
import type { QualityStatus } from '../../types/qualityStatus.types';
import TextField from './TextField';
import SelectField from './SelectField';
import Button from './Button';
import Alert from './Alert';
import { formatDate, formatCurrency } from '../../utils/format';

const today = () => new Date().toISOString().slice(0, 10);

interface QualitySectionProps {
  purchaseId: string;
}

const QualitySection = ({ purchaseId }: QualitySectionProps) => {
  const { user } = useAuth();
  const isOwner = user?.role === 'ADMIN';

  const [records, setRecords] = useState<QualityRecord[]>([]);
  const [statuses, setStatuses] = useState<QualityStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const emptyForm: QualityRecordFormData = {
    purchaseId,
    buyerId: '',
    qualityStatusId: '',
    grade: '',
    remarks: '',
    moisturePercentage: '',
    buyerRemarks: '',
    priceAdjustment: '',
    rejectionReason: '',
    assessmentDate: today(),
  };
  const [form, setForm] = useState<QualityRecordFormData>(emptyForm);

  const loadRecords = () => {
    setIsLoading(true);
    listQualityRecords({ purchaseId })
      .then((res) => setRecords(res.data))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadRecords, [purchaseId]);
  useEffect(() => {
    listQualityStatuses({ limit: 100, status: 'ACTIVE' }).then((res) => setStatuses(res.data));
  }, []);

  const selectedStatus = statuses.find((s) => s.id === form.qualityStatusId);

  const handleChange =
    (field: keyof QualityRecordFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await createQualityRecord(form);
      setIsAdding(false);
      setForm(emptyForm);
      loadRecords();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not save quality assessment.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Quality Assessment
        </h3>
        {isOwner && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-green-700 hover:underline"
          >
            + Record Quality
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3">
          <Alert type="error" message={error} />
        </div>
      )}

      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-3 mb-4"
        >
          <SelectField
            label="Quality Status"
            value={form.qualityStatusId}
            onChange={handleChange('qualityStatusId')}
            required
          >
            <option value="">Select a status</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>

          <TextField
            label="Grade (optional)"
            value={form.grade}
            onChange={handleChange('grade')}
            placeholder="Grade A"
          />
          <TextField
            label="Moisture % (optional)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.moisturePercentage}
            onChange={handleChange('moisturePercentage')}
          />
          <TextField
            label="Remarks (optional)"
            value={form.remarks}
            onChange={handleChange('remarks')}
          />
          <TextField
            label="Price Adjustment (₹/kg, optional)"
            type="number"
            step="0.01"
            value={form.priceAdjustment}
            onChange={handleChange('priceAdjustment')}
            hint="Recorded separately — never changes the purchase's locked rate directly."
            placeholder="-2 for a reduction, 0 if none"
          />

          {selectedStatus?.isRejection && (
            <TextField
              label="Rejection Reason *"
              value={form.rejectionReason}
              onChange={handleChange('rejectionReason')}
              hint="Required because this status is marked as a rejection."
              required
            />
          )}

          <TextField
            label="Assessment Date *"
            type="date"
            value={form.assessmentDate}
            onChange={handleChange('assessmentDate')}
            required
          />

          <div className="flex gap-2 mt-1">
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} className="flex-1">
              Save Assessment
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading quality records...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-400 mb-4">
          No quality assessment recorded yet for this purchase.
        </p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-4">
          {records.map((r) => (
            <div key={r.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span
                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${
                    r.qualityStatus.isRejection
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}
                >
                  {r.qualityStatus.name}
                </span>
                <span className="text-xs text-gray-400">{formatDate(r.assessmentDate)}</span>
              </div>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                {r.grade && <p>Grade: {r.grade}</p>}
                {r.moisturePercentage && <p>Moisture: {r.moisturePercentage}%</p>}
                {r.remarks && <p>Remarks: {r.remarks}</p>}
                {r.priceAdjustment && (
                  <p>Price Adjustment: {formatCurrency(r.priceAdjustment)}/kg</p>
                )}
                {r.rejectionReason && (
                  <p className="text-red-600">Rejection Reason: {r.rejectionReason}</p>
                )}
                {r.buyer && <p>Buyer: {r.buyer.companyName}</p>}
                {r.buyerRemarks && <p>Buyer Remarks: {r.buyerRemarks}</p>}
                <p className="text-xs text-gray-400">Assessed by {r.assessedByUser.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isOwner && (
        <p className="text-xs text-gray-400 mb-4">
          Only the owner can record or update quality assessments.
        </p>
      )}
    </div>
  );
};

export default QualitySection;
