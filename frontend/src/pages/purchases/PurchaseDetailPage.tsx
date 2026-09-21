import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPurchase, updatePurchase, updatePurchaseStatus } from '../../services/purchaseService';
import type { Purchase, PurchaseStatus, UpdatePurchaseFormData } from '../../types/purchase.types';
import PurchaseStatusBadge from '../../components/common/PurchaseStatusBadge';
import Button from '../../components/common/Button';
import TextField from '../../components/common/TextField';
import SelectField from '../../components/common/SelectField';
import Alert from '../../components/common/Alert';
import LoadingState from '../../components/common/LoadingState';
import WeighingSection from '../../components/common/WeighingSection';
import QualitySection from '../../components/common/QualitySection';
import { useConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate, formatWeight, formatStatusLabel } from '../../utils/format';

const statusOptions: PurchaseStatus[] = [
  'PENDING',
  'CONFIRMED',
  'COLLECTED',
  'AT_WAREHOUSE',
  'COMPLETED',
  'CANCELLED',
];

const PurchaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { confirm, confirmDialog } = useConfirmDialog();
  const [form, setForm] = useState<UpdatePurchaseFormData>({
    quality: '',
    estimatedQuantityKg: '',
    actualQuantityKg: '',
    numberOfBags: '',
    bagWeightKg: '',
    advanceAmount: '',
    purchaseDate: '',
    notes: '',
  });

  const loadPurchase = () => {
    if (!id) return;
    getPurchase(id)
      .then((p) => {
        setPurchase(p);
        setForm({
          quality: p.quality || '',
          estimatedQuantityKg: p.estimatedQuantityKg || '',
          actualQuantityKg: p.actualQuantityKg || '',
          numberOfBags: p.numberOfBags?.toString() || '',
          bagWeightKg: p.bagWeightKg,
          advanceAmount: p.advanceAmount,
          purchaseDate: p.purchaseDate.slice(0, 10),
          notes: p.notes || '',
        });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(loadPurchase, [id]);

  const isCancelled = purchase?.status === 'CANCELLED';
  const isCompleted = purchase?.status === 'COMPLETED';
  // COMPLETED freezes the physical deal terms (quantity, quality, bag
  // weight, date) but NOT the farmer payment — a farmer is often paid
  // in full only after the crop has already arrived and been recorded
  // as COMPLETED, so "Record Payment" (below) stays available then.
  const isTerminal = isCancelled || isCompleted;

  const handleChange =
    (field: keyof UpdatePurchaseFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSaveDetails = async (event: FormEvent) => {
    event.preventDefault();
    if (!purchase) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await updatePurchase(purchase.id, form);
      setPurchase(updated);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Purchase details updated.' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not save changes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!purchase) return;
    setIsSavingPayment(true);
    setMessage(null);
    try {
      const newAdvance = Number(purchase.advanceAmount) + Number(paymentAmount || 0);
      const updated = await updatePurchase(purchase.id, { advanceAmount: newAdvance.toString() });
      setPurchase(updated);
      setIsRecordingPayment(false);
      setPaymentAmount('');
      setMessage({ type: 'success', text: 'Payment recorded.' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not record payment.',
      });
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleStatusChange = async (newStatus: PurchaseStatus) => {
    if (!purchase) return;
    if (newStatus === 'CANCELLED') {
      const confirmed = await confirm({
        title: 'Cancel this purchase?',
        message: `${purchase.purchaseNumber} will be marked cancelled and can never be changed again. This cannot be undone.`,
        confirmLabel: 'Cancel Purchase',
        danger: true,
      });
      if (!confirmed) return;
    }
    setIsChangingStatus(true);
    setMessage(null);
    try {
      const updated = await updatePurchaseStatus(purchase.id, newStatus);
      setPurchase(updated);
      setMessage({ type: 'success', text: `Status changed to ${newStatus.replace('_', ' ')}.` });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Could not change status.',
      });
    } finally {
      setIsChangingStatus(false);
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading purchase..." />;
  }

  if (!purchase) {
    return (
      <div className="max-w-2xl mx-auto mt-10 text-center text-gray-500">
        Purchase not found.{' '}
        <Link to="/purchases" className="text-green-700 hover:underline">
          Back to purchase list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <Link to="/purchases" className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to Purchases
      </Link>

      <div className="flex items-start justify-between mt-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{purchase.purchaseNumber}</h2>
          <p className="text-sm text-gray-500">
            {purchase.farmer.name} · {purchase.crop.name}
          </p>
          <div className="flex gap-3 mt-1">
            <Link to={`/purchases/${purchase.id}/receipt`} className="text-xs text-green-700 hover:underline">
              Purchase Receipt
            </Link>
            <Link
              to={`/purchases/${purchase.id}/payment-receipt`}
              className="text-xs text-green-700 hover:underline"
            >
              Payment Receipt
            </Link>
          </div>
        </div>
        <PurchaseStatusBadge status={purchase.status} />
      </div>

      {message && (
        <div className="mb-4">
          <Alert type={message.type} message={message.text} />
        </div>
      )}

      {/* Frozen deal terms */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Deal Terms (Locked — never changes after creation)
        </div>
        <div className="divide-y divide-gray-100">
          {[
            ['Farmer', purchase.farmer.name],
            ['Crop', purchase.crop.name],
            ['Purchase Rate', `${formatCurrency(purchase.purchaseRatePerKg)}/kg`],
            ['Purchase Date', formatDate(purchase.purchaseDate)],
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="text-gray-800 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-lg font-semibold text-gray-800">
            {formatCurrency(purchase.totalGrossAmount)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-400">Advance Paid</p>
          <p className="text-lg font-semibold text-gray-800">
            {formatCurrency(purchase.advanceAmount)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-400">Remaining</p>
          <p
            className={`text-lg font-semibold ${
              Number(purchase.remainingPayable) > 0 ? 'text-amber-700' : 'text-gray-800'
            }`}
          >
            {formatCurrency(purchase.remainingPayable)}
          </p>
        </div>
      </div>

      {/* Recording a further payment to the farmer stays available even
          after the purchase is COMPLETED (when the full edit form below
          is hidden) — see isTerminal above. Before COMPLETED, the advance
          is already editable from the full "Edit" form, so this button
          only needs to appear once that form goes away. */}
      {isCompleted && Number(purchase.remainingPayable) > 0 && (
        <div className="mb-6">
          {isRecordingPayment ? (
            <form
              onSubmit={handleRecordPayment}
              className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-end gap-3"
            >
              <div className="flex-1">
                <TextField
                  label="Payment Amount (₹)"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={purchase.remainingPayable}
                  required
                  autoFocus
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  hint={`Outstanding balance: ${formatCurrency(purchase.remainingPayable)}`}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsRecordingPayment(false);
                    setPaymentAmount('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSavingPayment}>
                  Save Payment
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="secondary" onClick={() => setIsRecordingPayment(true)}>
              Record Farmer Payment
            </Button>
          )}
        </div>
      )}

      {/* Collection progress — editable */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Collection Details
        </h3>
        {!isTerminal && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-green-700 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {isTerminal && !isEditing && (
        <p className="text-xs text-gray-400 mb-3">
          This purchase is {purchase.status.toLowerCase()} and can no longer be edited.
        </p>
      )}

      {isEditing ? (
        <form
          onSubmit={handleSaveDetails}
          className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-4 mb-6"
        >
          <TextField
            label="Quality / Grade"
            value={form.quality}
            onChange={handleChange('quality')}
          />
          <TextField
            label="Estimated Quantity (kg)"
            type="number"
            step="0.001"
            value={form.estimatedQuantityKg}
            onChange={handleChange('estimatedQuantityKg')}
          />
          <TextField
            label="Actual Quantity (kg)"
            type="number"
            step="0.001"
            value={form.actualQuantityKg}
            onChange={handleChange('actualQuantityKg')}
            hint="Once entered, this drives the total amount instead of the estimate."
          />
          <TextField
            label="Number of Bags"
            type="number"
            step="1"
            value={form.numberOfBags}
            onChange={handleChange('numberOfBags')}
          />
          <TextField
            label="Bag Weight (kg)"
            type="number"
            step="0.001"
            value={form.bagWeightKg}
            onChange={handleChange('bagWeightKg')}
          />
          <TextField
            label="Advance Paid (₹)"
            type="number"
            step="0.01"
            value={form.advanceAmount}
            onChange={handleChange('advanceAmount')}
          />
          <TextField
            label="Purchase Date"
            type="date"
            value={form.purchaseDate}
            onChange={handleChange('purchaseDate')}
          />
          <TextField label="Notes" value={form.notes} onChange={handleChange('notes')} />

          <div className="flex gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-6">
          {[
            ['Quality / Grade', purchase.quality || '—'],
            [
              'Estimated Quantity',
              purchase.estimatedQuantityKg ? formatWeight(purchase.estimatedQuantityKg) : '—',
            ],
            [
              'Actual Quantity',
              purchase.actualQuantityKg ? formatWeight(purchase.actualQuantityKg) : 'Not weighed yet',
            ],
            ['Number of Bags', purchase.numberOfBags?.toString() || '—'],
            ['Bag Weight', formatWeight(purchase.bagWeightKg)],
            ['Notes', purchase.notes || '—'],
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="text-gray-800 font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Weighing */}
      <div className="mb-6">
        <WeighingSection
          purchaseId={purchase.id}
          defaultBagWeightKg={purchase.bagWeightKg}
          isTerminal={isTerminal}
          onWeighingRecorded={loadPurchase}
        />
      </div>

      {/* Quality */}
      <div className="mb-6">
        <QualitySection purchaseId={purchase.id} />
      </div>

      {/* Status management */}
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Status
      </h3>
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-end gap-3">
        <div className="w-48">
          <SelectField
            label="Purchase Status"
            value={purchase.status}
            onChange={(e) => handleStatusChange(e.target.value as PurchaseStatus)}
            disabled={isTerminal || isChangingStatus}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {formatStatusLabel(s)}
              </option>
            ))}
          </SelectField>
        </div>
        {isTerminal && (
          <span className="text-xs text-gray-400 mb-2">
            Final state — no further status changes possible.
          </span>
        )}
      </div>
      {confirmDialog}
    </div>
  );
};

export default PurchaseDetailPage;
