import { useEffect, useState, type FormEvent } from 'react';
import {
  getAssignmentPaymentSummary,
  createStaffPayment,
} from '../../services/staffPaymentService';
import type {
  AssignmentPaymentSummary,
  StaffPaymentFormData,
  PaymentMethod,
  StaffPaymentStatus,
} from '../../types/staffPayment.types';
import TextField from './TextField';
import SelectField from './SelectField';
import Button from './Button';
import Alert from './Alert';
import { formatDate, formatCurrency } from '../../utils/format';
import { extractErrorMessage } from '../../utils/apiError';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  OTHER: 'Other',
};

const statusBadgeClass: Record<StaffPaymentStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-green-50 text-green-700 border-green-200',
};

interface StaffPaymentSectionProps {
  assignmentId: string;
}

const StaffPaymentSection = ({ assignmentId }: StaffPaymentSectionProps) => {
  const [summary, setSummary] = useState<AssignmentPaymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const emptyForm: StaffPaymentFormData = {
    assignmentId,
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: '',
    transactionReferenceNumber: '',
    notes: '',
  };
  const [form, setForm] = useState<StaffPaymentFormData>(emptyForm);

  const loadSummary = () => {
    setIsLoading(true);
    setLoadError('');
    getAssignmentPaymentSummary(assignmentId)
      .then(setSummary)
      .catch((err) => setLoadError(extractErrorMessage(err, 'Could not load payment summary.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadSummary, [assignmentId]);

  const handleChange =
    (field: keyof StaffPaymentFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await createStaffPayment(form);
      setForm({ ...emptyForm, paymentDate: new Date().toISOString().slice(0, 10) });
      setIsAdding(false);
      loadSummary();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save payment.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Staff Payments
        </h3>
        <p className="text-sm text-gray-400">Loading payments...</p>
      </div>
    );
  }

  if (loadError || !summary) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Staff Payments
        </h3>
        <Alert type="error" message={loadError || 'Could not load payment summary.'} />
      </div>
    );
  }

  const canRecordPayment = summary.paymentStatus !== 'PAID';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Staff Payments
        </h3>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass[summary.paymentStatus]}`}
        >
          {summary.paymentStatus}
        </span>
      </div>

      {error && (
        <div className="mb-3">
          <Alert type="error" message={error} />
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-4">
        <div className="px-4 py-3 flex justify-between text-sm">
          <span className="text-gray-500">Labour Amount</span>
          <span className="text-gray-800 font-medium">
            {formatCurrency(summary.totalLabourAmount)}
          </span>
        </div>
        <div className="px-4 py-3 flex justify-between text-sm">
          <span className="text-gray-500">Amount Paid</span>
          <span className="text-gray-800 font-medium">{formatCurrency(summary.totalPaid)}</span>
        </div>
        <div className="px-4 py-3 flex justify-between text-sm bg-gray-50">
          <span className="text-gray-700 font-medium">Outstanding to Staff</span>
          <span
            className={`font-semibold ${summary.outstandingAmount > 0 ? 'text-red-600' : 'text-green-700'}`}
          >
            {formatCurrency(summary.outstandingAmount)}
          </span>
        </div>
      </div>

      {canRecordPayment && !isAdding && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Record a payment made to this staff member.</p>
          <Button onClick={() => setIsAdding(true)}>+ Record Payment</Button>
        </div>
      )}

      {canRecordPayment && isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-3 mb-4"
        >
          <TextField
            label="Amount (₹) *"
            type="number"
            step="0.01"
            min="0"
            max={summary.outstandingAmount}
            value={form.amount}
            onChange={handleChange('amount')}
            hint={`Outstanding: ${formatCurrency(summary.outstandingAmount)}`}
            required
          />
          <TextField
            label="Payment Date *"
            type="date"
            value={form.paymentDate}
            onChange={handleChange('paymentDate')}
            required
          />
          <SelectField
            label="Payment Method"
            value={form.paymentMethod}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))
            }
            required
          >
            <option value="">Select a method</option>
            {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
              <option key={method} value={method}>
                {paymentMethodLabels[method]}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Transaction / Reference Number (optional)"
            value={form.transactionReferenceNumber}
            onChange={handleChange('transactionReferenceNumber')}
            placeholder="UPI ref, cheque no., UTR, etc."
          />
          <TextField label="Notes (optional)" value={form.notes} onChange={handleChange('notes')} />

          <div className="flex gap-2 mt-1">
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving} className="flex-1">
              Save Payment
            </Button>
          </div>
        </form>
      )}

      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Payment History
      </h4>
      {summary.payments.length === 0 ? (
        <p className="text-sm text-gray-400">No payments recorded yet for this assignment.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Payment #</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Reference</th>
                <th className="px-4 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summary.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 text-gray-800 font-medium">{payment.paymentNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(payment.paymentDate)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {paymentMethodLabels[payment.paymentMethod]}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {payment.transactionReferenceNumber || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPaymentSection;
