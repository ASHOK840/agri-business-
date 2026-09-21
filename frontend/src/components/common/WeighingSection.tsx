import { useEffect, useState, type FormEvent } from 'react';
import { listWeighingRecords, createWeighingRecord } from '../../services/weighingRecordService';
import type { WeighingRecord, WeighingRecordFormData } from '../../types/weighingRecord.types';
import TextField from './TextField';
import Button from './Button';
import Alert from './Alert';
import { formatDate, formatWeight, formatSignedWeight } from '../../utils/format';

interface WeighingSectionProps {
  purchaseId: string;
  defaultBagWeightKg: string;
  isTerminal: boolean;
  onWeighingRecorded?: () => void;
}

const WeighingSection = ({
  purchaseId,
  defaultBagWeightKg,
  isTerminal,
  onWeighingRecorded,
}: WeighingSectionProps) => {
  const [records, setRecords] = useState<WeighingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<WeighingRecordFormData>({
    purchaseId,
    numberOfBags: '',
    standardBagWeightKg: defaultBagWeightKg,
    actualWeightKg: '',
    weighingDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const loadRecords = () => {
    setIsLoading(true);
    listWeighingRecords({ purchaseId })
      .then((res) => setRecords(res.data))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadRecords, [purchaseId]);

  const handleChange =
    (field: keyof WeighingRecordFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  // Live preview so staff can see the difference clearly before saving,
  // not just after.
  const previewBags = Number(form.numberOfBags) || 0;
  const previewStandardWeight = Number(form.standardBagWeightKg) || 0;
  const previewExpected = previewBags * previewStandardWeight;
  const previewActual = Number(form.actualWeightKg) || 0;
  const previewDifference = previewActual - previewExpected;
  const hasPreview = previewBags > 0 && previewStandardWeight > 0 && form.actualWeightKg !== '';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await createWeighingRecord(form);
      setIsAdding(false);
      setForm({
        purchaseId,
        numberOfBags: '',
        standardBagWeightKg: defaultBagWeightKg,
        actualWeightKg: '',
        weighingDate: new Date().toISOString().slice(0, 10),
        notes: '',
      });
      loadRecords();
      onWeighingRecorded?.();
    } catch (err: any) {
      const response = err?.response?.data;
      const fieldMessage = response?.errors?.[0]?.message;
      setError(fieldMessage || response?.message || 'Could not save weighing record.');
    } finally {
      setIsSaving(false);
    }
  };

  const diffColor = (diff: number) => {
    if (diff === 0) return 'text-gray-600';
    return diff < 0 ? 'text-red-600' : 'text-blue-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Weighing Records
        </h3>
        {!isTerminal && !isAdding && (
          <button onClick={() => setIsAdding(true)} className="text-sm text-green-700 hover:underline">
            + Add Weighing
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
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Number of Bags"
              type="number"
              step="1"
              value={form.numberOfBags}
              onChange={handleChange('numberOfBags')}
              required
            />
            <TextField
              label="Standard Bag Weight (kg)"
              type="number"
              step="0.001"
              value={form.standardBagWeightKg}
              onChange={handleChange('standardBagWeightKg')}
              required
            />
          </div>
          <TextField
            label="Actual Weight (kg)"
            type="number"
            step="0.001"
            value={form.actualWeightKg}
            onChange={handleChange('actualWeightKg')}
            hint="What the scale actually read for this collection."
            required
          />
          <TextField
            label="Weighing Date"
            type="date"
            value={form.weighingDate}
            onChange={handleChange('weighingDate')}
            required
          />
          <TextField label="Notes (optional)" value={form.notes} onChange={handleChange('notes')} />

          {hasPreview && (
            <div className="bg-gray-50 rounded-md p-3 text-sm flex justify-between">
              <span className="text-gray-500">
                Expected: {previewExpected.toFixed(3)} kg ({previewBags} × {previewStandardWeight}
                kg)
              </span>
              <span className={`font-semibold ${diffColor(previewDifference)}`}>
                {previewDifference > 0 ? '+' : ''}
                {previewDifference.toFixed(3)} kg{' '}
                {previewDifference === 0 ? '(exact match)' : previewDifference < 0 ? '(short)' : '(over)'}
              </span>
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} className="flex-1">
              Save Weighing
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading weighing records...</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-400 mb-4">No weighing recorded yet for this purchase.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Bags</th>
                <th className="px-4 py-2 font-medium">Expected</th>
                <th className="px-4 py-2 font-medium">Actual</th>
                <th className="px-4 py-2 font-medium">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((record) => {
                const diff = Number(record.weightDifferenceKg);
                return (
                  <tr key={record.id}>
                    <td className="px-4 py-3 text-gray-800">{formatDate(record.weighingDate)}</td>
                    <td className="px-4 py-3 text-gray-500">{record.numberOfBags}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatWeight(record.expectedWeightKg)}
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {formatWeight(record.actualWeightKg)}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${diffColor(diff)}`}>
                      {formatSignedWeight(diff)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeighingSection;
